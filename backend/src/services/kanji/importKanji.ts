import type { ImportKanjiResponse, SubjectId } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { ExamCandidateTable, ExamHistoryTable, KanjiTable } from '@/types/db';

import { computeKanjiQuestionFields, parsePipeQuestionLine } from './kanji.lib';
import type {
  BatchBuildResult,
  BuildCandidateRowParams,
  BuildCandidatesFromHistoriesParams,
  KanjiService,
  ParseRowsResult,
  ParsedImportRow,
} from './kanji.types';

const buildHistoryItem = (params: {
  subject: SubjectId;
  questionId: string;
  nextTime: string;
  correctCount: number;
  status: 'CLOSED' | 'EXCLUDED';
  closedAt: string;
}): ExamHistoryTable => {
  // import 起点の履歴は exam_candidates へ戻さないため、履歴IDは都度採番する。
  return {
    id: createUuid(),
    subject: params.subject,
    questionId: params.questionId,
    mode: 'KANJI',
    status: params.status,
    correctCount: params.correctCount,
    nextTime: params.nextTime,
    closedAt: params.closedAt,
  };
};

const buildCandidateRow = (params: BuildCandidateRowParams): ExamCandidateTable => {
  const id = createUuid();
  const createdAt = params.createdAtIso ?? DateUtils.now();
  return {
    subject: params.subject,
    // 次回日付を先頭に持つことで dueDate 順の取得にそのまま使えるようにする。
    candidateKey: `${params.nextTime}#${id}`,
    id,
    questionId: params.questionId,
    mode: params.mode,
    status: params.status,
    correctCount: Math.max(0, Math.trunc(params.correctCount)),
    nextTime: params.nextTime,
    createdAt,
  };
};

const buildCandidatesFromHistories = (
  params: BuildCandidatesFromHistoriesParams,
): {
  histories: ExamHistoryTable[];
  candidate: ExamCandidateTable | null;
} => {
  if (params.histories.length === 0) {
    return { histories: [], candidate: null };
  }

  // 取り込みファイルの履歴順に依存しないよう、業務比較に使う submittedDate で昇順化する。
  const sorted = [...params.histories].sort((a, b) => (a.submittedDate < b.submittedDate ? -1 : 1));
  // import 時に履歴テーブルへ戻すのは直近3件までに制限し、それ以前の履歴は再構成対象から外す。
  const recent = sorted.slice(Math.max(0, sorted.length - 3));

  const histories: ExamHistoryTable[] = [];

  let streak = 0;
  let lastAttemptIso = '';
  let computedNextTime = '';
  let computedCorrectCount = 0;
  let hasExcludedHistory = false;

  // 直近3件だけを連続正解数つきで再生し、3連続正解に到達した回はその履歴自体を EXCLUDED にする。
  for (const h of recent) {
    const computed = ReviewNextTime.compute({
      mode: 'KANJI',
      baseDateYmd: h.submittedDate,
      isCorrect: h.isCorrect,
      currentCorrectCount: streak,
    });
    const historyStatus =
      computed.nextTime === ReviewNextTime.EXCLUDED_NEXT_TIME ? 'EXCLUDED' : 'CLOSED';

    histories.push(
      buildHistoryItem({
        subject: params.subject,
        questionId: params.targetWordId,
        nextTime: computed.nextTime,
        correctCount: computed.nextCorrectCount,
        status: historyStatus,
        closedAt: DateUtils.toIso(h.submittedDate),
      }),
    );

    streak = computed.nextCorrectCount;
    // 最終候補は最後の実施時点を createdAt 相当として持たせるため保持しておく。
    lastAttemptIso = DateUtils.toIso(h.submittedDate);
    computedNextTime = computed.nextTime;
    computedCorrectCount = computed.nextCorrectCount;
    hasExcludedHistory = historyStatus === 'EXCLUDED';
  }

  // 履歴から次回候補を導けない場合は、履歴だけを保存して候補は作らない。
  if (!computedNextTime || !lastAttemptIso) {
    return { histories, candidate: null };
  }

  // EXCLUDED 履歴を追加した時点で将来候補は不要なので、そのまま履歴だけ返す。
  if (hasExcludedHistory) {
    return { histories, candidate: null };
  }

  return {
    histories,
    // 候補テーブルへ残すのは、次回出題対象として有効な OPEN だけに限定する。
    candidate: buildCandidateRow({
      subject: params.subject,
      questionId: params.targetWordId,
      mode: 'KANJI',
      nextTime: computedNextTime,
      correctCount: computedCorrectCount,
      status: 'OPEN',
      createdAtIso: lastAttemptIso,
    }),
  };
};

const normalizeImportLines = (fileContent: string): string[] => {
  return (
    fileContent
      // 改行差異を吸収して、Windows/Unix どちらの貼り付けでも同じ扱いにする。
      .split(/\r?\n/)
      .map((x) => x.replaceAll('　', ' ').trim())
      .filter((x) => x.length > 0)
  );
};

const parseValidRows = (params: { lines: string[]; formatErrorReason: string }): ParseRowsResult => {
  const seenKey = new Set<string>();
  const rows: ParsedImportRow[] = [];
  let duplicateCount = 0;
  let errorCount = 0;
  const errors: ImportKanjiResponse['errors'] = [];

  for (let index = 0; index < params.lines.length; index += 1) {
    const line = params.lines[index];
    const lineNumber = index + 1;

    // 区切り文字が無い行は以降の厳密パースに進めても復元不能なので即エラーにする。
    if (!line.includes('|')) {
      errorCount += 1;
      errors.push({ line: lineNumber, content: line, reason: params.formatErrorReason });
      continue;
    }

    let parsed: {
      question: string;
      answer: string;
      histories: ParsedImportRow['histories'];
    };
    try {
      parsed = parsePipeQuestionLine(line);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      errorCount += 1;
      errors.push({
        line: lineNumber,
        content: line,
        reason: message === 'フォーマットが不正です' ? params.formatErrorReason : message,
      });
      continue;
    }

    const question = parsed.question.trim();
    const answer = parsed.answer.trim();
    if (!question) {
      errorCount += 1;
      errors.push({ line: lineNumber, content: line, reason: '本文が空です' });
      continue;
    }
    if (!answer) {
      errorCount += 1;
      errors.push({ line: lineNumber, content: line, reason: '答え漢字が空です' });
      continue;
    }

    const key = `${question}|${answer}`;
    // 同一ファイル内の重複は DB 照会前に落として duplicateCount のみに反映する。
    if (seenKey.has(key)) {
      duplicateCount += 1;
      continue;
    }
    seenKey.add(key);

    rows.push({
      lineNumber,
      content: line,
      question,
      answer,
      histories: parsed.histories,
      wordId: createUuid(),
    });
  }

  return {
    rows,
    duplicateCount,
    errorCount,
    errors,
  };
};

const buildItemsByBatch = async (params: {
  repositories: Repositories;
  rows: ParsedImportRow[];
  subject: SubjectId;
}): Promise<BatchBuildResult> => {
  const kanjiItems: KanjiTable[] = [];
  const candidatesToCreate: ExamCandidateTable[] = [];
  const historiesToCreate: ExamHistoryTable[] = [];
  const questionIds: string[] = [];
  const errors: ImportKanjiResponse['errors'] = [];
  let duplicateCount = 0;
  let successCount = 0;
  let errorCount = 0;
  const batchSize = 100;

  for (let start = 0; start < params.rows.length; start += batchSize) {
    const batch = params.rows.slice(start, start + batchSize);
    // 既存データとの重複は行ごとに照会し、全件事前取得は行わない。
    const duplicateChecks = await Promise.all(
      batch.map(async (row) => {
        const existing = await params.repositories.kanji.findByQuestionAnswer({
          subject: params.subject,
          question: row.question,
          answer: row.answer,
        });

        return {
          row,
          // 既存一致があればこの行は保存せず duplicateCount のみ増やす。
          isDuplicate: existing !== null,
        };
      }),
    );

    // 既存重複を除外した行だけを読み生成へ流す。
    const rowsToGenerate = duplicateChecks.flatMap((entry) => {
      if (!entry.isDuplicate) {
        return [entry.row];
      }

      duplicateCount += 1;
      return [];
    });

    if (rowsToGenerate.length === 0) {
      // バッチ全件が重複なら Bedrock 呼び出し自体を省略して次へ進む。
      continue;
    }

    let bulkGenerated: { items: Array<{ id: string; readingHiragana: string }> };
    try {
      // 読み生成は外部依存なので、成功した行だけ後段へ進めるようバッチ単位で切り出す。
      bulkGenerated = await params.repositories.bedrock.generateKanjiQuestionReadingsBulk({
        items: rowsToGenerate.map((row) => ({ id: row.wordId, question: row.question, answer: row.answer })),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      // 外部生成に失敗した場合でも他バッチの処理継続を優先し、対象行だけ失敗として返す。
      for (const row of rowsToGenerate) {
        errorCount += 1;
        errors.push({ line: row.lineNumber, content: row.content, reason: `読み生成に失敗しました: ${message}` });
      }
      continue;
    }

    const byId = new Map(bulkGenerated.items.map((x) => [String(x.id ?? ''), x] as const));
    for (const row of rowsToGenerate) {
      const raw = byId.get(row.wordId);
      if (!raw) {
        // 一部 id のみ返らないケースも、行単位エラーに落として他行の保存は継続する。
        errorCount += 1;
        errors.push({
          line: row.lineNumber,
          content: row.content,
          reason: '読み生成に失敗しました: 結果が返りませんでした',
        });
        continue;
      }

      try {
        const computed = computeKanjiQuestionFields({
          question: row.question,
          readingHiragana: String(raw.readingHiragana ?? '').trim(),
        });

        // kanji 本体が保存できる行だけを後段の履歴/候補組み立て対象に含める。
        kanjiItems.push({
          wordId: row.wordId,
          subject: params.subject,
          question: row.question,
          answer: row.answer,
          readingHiragana: computed.readingHiragana,
          underlineSpec: computed.underlineSpec,
        });

        // 履歴付き行は OPEN 候補1件と履歴群へ再構成し、CLOSED を候補テーブルへ入れない。
        if (row.histories.length > 0) {
          const rebuilt = buildCandidatesFromHistories({
            subject: params.subject,
            targetWordId: row.wordId,
            histories: row.histories,
          });
          // CLOSED/EXCLUDED は履歴側、OPEN だけは候補側という責務分離をここで確定する。
          historiesToCreate.push(...rebuilt.histories);
          if (rebuilt.candidate) {
            candidatesToCreate.push(rebuilt.candidate);
          }
        } else {
          // 履歴なし行は未実施の新規問題として即 OPEN 候補を作る。
          candidatesToCreate.push(
            buildCandidateRow({
              subject: params.subject,
              questionId: row.wordId,
              mode: 'KANJI',
              nextTime: DateUtils.todayYmd(),
              correctCount: 0,
              status: 'OPEN',
              createdAtIso: DateUtils.now(),
            }),
          );
        }

        // 正常終了した行だけ successCount と questionIds に反映する。
        successCount += 1;
        questionIds.push(row.wordId);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        // 下線位置計算などの局所失敗は行単位エラーに閉じ込め、他行は処理継続する。
        errorCount += 1;
        errors.push({ line: row.lineNumber, content: row.content, reason: `読み生成に失敗しました: ${message}` });
      }
    }
  }

  return {
    kanjiItems,
    candidatesToCreate,
    historiesToCreate,
    duplicateCount,
    successCount,
    errorCount,
    errors,
    questionIds,
  };
};

const persistImportedRows = async (params: {
  repositories: Repositories;
  kanjiItems: KanjiTable[];
  historiesToCreate: ExamHistoryTable[];
  candidatesToCreate: ExamCandidateTable[];
}): Promise<void> => {
  // 参照元の本体データを先に保存し、後段の履歴/候補が孤立しない順序にする。
  await params.repositories.kanji.bulkCreate(params.kanjiItems);

  if (params.historiesToCreate.length > 0) {
    // 履歴は 1 件ずつ冪等保存し、既存行との競合は全体失敗にしない。
    await Promise.all(
      params.historiesToCreate.map(async (history) => {
        try {
          await params.repositories.examHistories.putHistory(history);
        } catch (e) {
          const name = (e as { name?: string } | null)?.name;
          // 既存履歴との衝突だけは冪等実行として握りつぶす。
          if (name !== 'ConditionalCheckFailedException') {
            throw e;
          }
        }
      }),
    );
  }

  // 候補テーブルへ入るのは OPEN 候補だけという前提で最後に一括保存する。
  await params.repositories.examCandidates.bulkCreateCandidates(params.candidatesToCreate);
};

export const createImportKanji = (repositories: Repositories): KanjiService['importKanji'] => {
  return async (data: Parameters<KanjiService['importKanji']>[0]): Promise<ImportKanjiResponse> => {
    const subject = data.subject;
    const lines = normalizeImportLines(data.fileContent);
    const formatErrorReason = '形式が不正です（1行=「本文|答え漢字|YYYY-MM-DD,OK|...」）';

    // まずファイル内だけで判定できる形式不正と重複を落とす。
    const parsedResult = parseValidRows({ lines, formatErrorReason });

    // 次に外部照会と読み生成を伴う重い処理を、解析済み行だけに対して実行する。
    const buildResult = await buildItemsByBatch({
      repositories,
      rows: parsedResult.rows,
      subject,
    });

    // 永続化は build 済みの成果物だけを使い、途中フェーズに戻らない。
    await persistImportedRows({
      repositories,
      kanjiItems: buildResult.kanjiItems,
      historiesToCreate: buildResult.historiesToCreate,
      candidatesToCreate: buildResult.candidatesToCreate,
    });

    // 複数フェーズの結果を最後に集約して返すことで、失敗行と成功行を同時に可視化する。
    const errors = [...parsedResult.errors, ...buildResult.errors];
    const errorCount = parsedResult.errorCount + buildResult.errorCount;
    const successCount = buildResult.successCount;
    // duplicateCount は「ファイル内重複」と「既存DB重複」の合算値を返す。
    const duplicateCount = parsedResult.duplicateCount + buildResult.duplicateCount;
    const questionIds = buildResult.questionIds;

    // 処理結果を呼び出し元へ返す
    return {
      successCount,
      duplicateCount,
      errorCount,
      questionIds,
      errors,
    };
  };
};
