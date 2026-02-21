import type { ImportKanjiResponse, SubjectId } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { ExamCandidateTable, ExamHistoryTable, WordMasterTable } from '@/types/db';

import { computeKanjiQuestionFields } from './kanji.lib';
import type {
  BatchBuildResult,
  BuildCandidateRowParams,
  BuildCandidatesFromHistoriesParams,
  KanjiService,
  ParseRowsResult,
  ParsedImportRow,
} from './kanji.types';
import { parsePipeQuestionLine } from './importUtils';

const toHistoryItem = (candidate: ExamCandidateTable): ExamHistoryTable => {
  return {
    subject: candidate.subject,
    candidateKey: candidate.candidateKey,
    id: candidate.id,
    questionId: candidate.questionId,
    mode: candidate.mode,
    status: 'CLOSED',
    correctCount: candidate.correctCount,
    nextTime: candidate.nextTime,
    createdAt: candidate.createdAt,
    closedAt: candidate.createdAt,
  };
};

const buildCandidateRow = (params: BuildCandidateRowParams): ExamCandidateTable => {
  const id = createUuid();
  const createdAt = params.createdAtIso ?? DateUtils.now();
  return {
    subject: params.subject,
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

const buildCandidatesFromHistories = (params: BuildCandidatesFromHistoriesParams): ExamCandidateTable[] => {
  if (params.histories.length === 0) return [];

  const sorted = [...params.histories].sort((a, b) => (a.submittedDate < b.submittedDate ? -1 : 1));
  const recent = sorted.slice(Math.max(0, sorted.length - 3));

  const candidates: ExamCandidateTable[] = [];

  for (const h of sorted.slice(0, Math.max(0, sorted.length - 3))) {
    candidates.push(
      buildCandidateRow({
        subject: params.subject,
        questionId: params.targetWordId,
        mode: 'KANJI',
        nextTime: h.submittedDate,
        correctCount: 0,
        status: 'CLOSED',
        createdAtIso: DateUtils.toIso(h.submittedDate),
      }),
    );
  }

  let streak = 0;
  let lastAttemptIso = '';
  let computedNextTime = '';
  let computedCorrectCount = 0;

  for (const h of recent) {
    const computed = ReviewNextTime.compute({
      mode: 'KANJI',
      baseDateYmd: h.submittedDate,
      isCorrect: h.isCorrect,
      currentCorrectCount: streak,
    });

    candidates.push(
      buildCandidateRow({
        subject: params.subject,
        questionId: params.targetWordId,
        mode: 'KANJI',
        nextTime: computed.nextTime,
        correctCount: computed.nextCorrectCount,
        status: 'CLOSED',
        createdAtIso: DateUtils.toIso(h.submittedDate),
      }),
    );

    streak = computed.nextCorrectCount;
    lastAttemptIso = DateUtils.toIso(h.submittedDate);
    computedNextTime = computed.nextTime;
    computedCorrectCount = computed.nextCorrectCount;
  }

  if (!computedNextTime || !lastAttemptIso) return candidates;

  const finalStatus =
    params.finalStatus === 'EXCLUDED'
      ? 'EXCLUDED'
      : computedNextTime === ReviewNextTime.EXCLUDED_NEXT_TIME
        ? 'EXCLUDED'
        : 'OPEN';

  candidates.push(
    buildCandidateRow({
      subject: params.subject,
      questionId: params.targetWordId,
      mode: 'KANJI',
      nextTime: computedNextTime,
      correctCount: computedCorrectCount,
      status: finalStatus,
      createdAtIso: lastAttemptIso,
    }),
  );

  return candidates;
};

const normalizeImportLines = (fileContent: string): string[] => {
  return fileContent
    .split(/\r?\n/)
    .map((x) => x.replaceAll('　', ' ').trim())
    .filter((x) => x.length > 0);
};

const parseValidRows = (params: {
  lines: string[];
  existingKey: Set<string>;
  formatErrorReason: string;
}): ParseRowsResult => {
  const seenKey = new Set<string>();
  const rows: ParsedImportRow[] = [];
  let duplicateCount = 0;
  let errorCount = 0;
  const errors: ImportKanjiResponse['errors'] = [];

  for (let index = 0; index < params.lines.length; index += 1) {
    const line = params.lines[index];
    const lineNumber = index + 1;

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
    if (params.existingKey.has(key) || seenKey.has(key)) {
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
  const wordMasterItems: WordMasterTable[] = [];
  const candidatesToCreate: ExamCandidateTable[] = [];
  const historiesToCreate: ExamHistoryTable[] = [];
  const candidateTargetsToDelete: Array<{ subject: SubjectId; targetId: string }> = [];
  const questionIds: string[] = [];
  const errors: ImportKanjiResponse['errors'] = [];
  let successCount = 0;
  let errorCount = 0;
  const batchSize = 100;

  for (let start = 0; start < params.rows.length; start += batchSize) {
    const batch = params.rows.slice(start, start + batchSize);

    let bulkGenerated: { items: Array<{ id: string; readingHiragana: string }> };
    try {
      bulkGenerated = await params.repositories.bedrock.generateKanjiQuestionReadingsBulk({
        items: batch.map((r) => ({ id: r.wordId, question: r.question, answer: r.answer })),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      for (const row of batch) {
        errorCount += 1;
        errors.push({ line: row.lineNumber, content: row.content, reason: `読み生成に失敗しました: ${message}` });
      }
      continue;
    }

    const byId = new Map(bulkGenerated.items.map((x) => [String(x.id ?? ''), x] as const));
    for (const row of batch) {
      const raw = byId.get(row.wordId);
      if (!raw) {
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

        wordMasterItems.push({
          wordId: row.wordId,
          subject: params.subject,
          question: row.question,
          answer: row.answer,
          readingHiragana: computed.readingHiragana,
          underlineSpec: computed.underlineSpec,
        });

        // 履歴付き取り込みは既存候補と二重化しないよう、対象ID単位で一旦全削除してから再構築する。
        if (row.histories.length > 0) {
          candidateTargetsToDelete.push({ subject: params.subject, targetId: row.wordId });
          const rebuilt = buildCandidatesFromHistories({
            subject: params.subject,
            targetWordId: row.wordId,
            histories: row.histories,
            finalStatus: 'AUTO',
          });
          historiesToCreate.push(...rebuilt.filter((x) => x.status === 'CLOSED').map(toHistoryItem));
          candidatesToCreate.push(...rebuilt.filter((x) => x.status !== 'CLOSED'));
        } else {
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

        successCount += 1;
        questionIds.push(row.wordId);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        errorCount += 1;
        errors.push({ line: row.lineNumber, content: row.content, reason: `読み生成に失敗しました: ${message}` });
      }
    }
  }

  return {
    wordMasterItems,
    candidatesToCreate,
    historiesToCreate,
    candidateTargetsToDelete,
    successCount,
    errorCount,
    errors,
    questionIds,
  };
};

const persistImportedRows = async (params: {
  repositories: Repositories;
  wordMasterItems: WordMasterTable[];
  historiesToCreate: ExamHistoryTable[];
  candidateTargetsToDelete: Array<{ subject: SubjectId; targetId: string }>;
  candidatesToCreate: ExamCandidateTable[];
}): Promise<void> => {
  await params.repositories.wordMaster.bulkCreate(params.wordMasterItems);

  if (params.candidateTargetsToDelete.length > 0) {
    await Promise.all(
      params.candidateTargetsToDelete.map((target) => {
        return params.repositories.examCandidates.deleteCandidatesByTargetId({
          subject: target.subject,
          targetId: target.targetId,
        });
      }),
    );
  }

  if (params.historiesToCreate.length > 0) {
    await Promise.all(
      params.historiesToCreate.map(async (history) => {
        try {
          await params.repositories.examHistories.putHistory(history);
        } catch (e) {
          const name = (e as { name?: string } | null)?.name;
          if (name !== 'ConditionalCheckFailedException') {
            throw e;
          }
        }
      }),
    );
  }

  await params.repositories.examCandidates.bulkCreateCandidates(params.candidatesToCreate);
};

const importKanjiImpl = async (
  repositories: Repositories,
  data: Parameters<KanjiService['importKanji']>[0],
): Promise<ImportKanjiResponse> => {
  const subject = data.subject;
  const lines = normalizeImportLines(data.fileContent);
  const formatErrorReason = '形式が不正です（1行=「本文|答え漢字|YYYY-MM-DD,OK|...」）';

  // 既存データと同一キーの重複登録を避けるため、question+answer のキー集合を先に作成する。
  const existing = (await repositories.wordMaster.listKanji(subject)).filter((x) => Boolean(x.underlineSpec));
  const existingKey = new Set(
    existing.map((x) => `${String(x.question ?? '').trim()}|${String(x.answer ?? '').trim()}`).filter((x) => x !== '|'),
  );
  const parsedResult = parseValidRows({ lines, existingKey, formatErrorReason });

  const buildResult = await buildItemsByBatch({
    repositories,
    rows: parsedResult.rows,
    subject,
  });

  await persistImportedRows({
    repositories,
    wordMasterItems: buildResult.wordMasterItems,
    historiesToCreate: buildResult.historiesToCreate,
    candidateTargetsToDelete: buildResult.candidateTargetsToDelete,
    candidatesToCreate: buildResult.candidatesToCreate,
  });

  // 複数フェーズの結果を最後に集約して返すことで、失敗行と成功行を同時に可視化する。
  const errors = [...parsedResult.errors, ...buildResult.errors];
  const errorCount = parsedResult.errorCount + buildResult.errorCount;
  const successCount = buildResult.successCount;
  const duplicateCount = parsedResult.duplicateCount;
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

export const createImportKanji = (repositories: Repositories): KanjiService['importKanji'] => {
  return importKanjiImpl.bind(null, repositories);
};
