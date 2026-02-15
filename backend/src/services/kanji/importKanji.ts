import type { ImportKanjiResponse, SubjectId } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { ExamCandidateTable, WordMasterTable } from '@/types/db';

import { computeKanjiQuestionFields } from './computeKanjiQuestionFields';
import type { KanjiService } from './createKanjiService';
import type { BuildCandidateRowParams, BuildCandidatesFromHistoriesParams } from './importKanji.types';
import { parsePipeQuestionLine } from './importUtils';

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

const importKanjiImpl = async (
  repositories: Repositories,
  data: Parameters<KanjiService['importKanji']>[0],
): Promise<ImportKanjiResponse> => {
  // 処理で使う値を準備する
  const subject = data.subject;

  // 処理で使う値を準備する
  const lines = data.fileContent
    .split(/\r?\n/)
    .map((x) => x.replaceAll('　', ' ').trim())
    .filter((x) => x.length > 0);

  const questionIds: string[] = [];

  // 後続処理で更新する値を初期化する
  let successCount = 0;
  // 後続処理で更新する値を初期化する
  let duplicateCount = 0;
  // 後続処理で更新する値を初期化する
  let errorCount = 0;
  const errors: ImportKanjiResponse['errors'] = [];

  // 処理で使う値を準備する
  const formatErrorReason = '形式が不正です（1行=「本文|答え漢字|YYYY-MM-DD,OK|...」）';

  // 非同期で必要な値を取得する
  const existing = (await repositories.wordMaster.listKanji(subject)).filter((x) => Boolean(x.underlineSpec));
  // 処理で使う値を準備する
  const existingKey = new Set(
    existing.map((x) => `${String(x.question ?? '').trim()}|${String(x.answer ?? '').trim()}`).filter((x) => x !== '|'),
  );
  // 処理で使う値を準備する
  const seenKey = new Set<string>();

  const validRows: Array<{
    lineNumber: number;
    content: string;
    question: string;
    answer: string;
    histories: { submittedDate: string; isCorrect: boolean }[];
    wordId: string;
  }> = [];

  // 対象データを順番に処理する
  for (let index = 0; index < lines.length; index += 1) {
    // 処理で使う値を準備する
    const line = lines[index];

    // 条件に応じて処理を分岐する
    if (!line.includes('|')) {
      errorCount += 1;
      errors.push({ line: index + 1, content: line, reason: formatErrorReason });
      continue;
    }

    let parsed: {
      question: string;
      answer: string;
      histories: { submittedDate: string; isCorrect: boolean }[];
    };
    // 例外が発生しうる処理を実行する
    try {
      // 値を代入する
      parsed = parsePipeQuestionLine(line);
    } catch (e) {
      // 処理で使う値を準備する
      const message = e instanceof Error ? e.message : 'Unknown error';
      errorCount += 1;
      errors.push({
        line: index + 1,
        content: line,
        reason: message === 'フォーマットが不正です' ? formatErrorReason : message,
      });
      continue;
    }

    // 処理で使う値を準備する
    const question = parsed.question.trim();
    // 処理で使う値を準備する
    const answer = parsed.answer.trim();
    // 条件に応じて処理を分岐する
    if (!question) {
      errorCount += 1;
      errors.push({ line: index + 1, content: line, reason: '本文が空です' });
      continue;
    }
    // 条件に応じて処理を分岐する
    if (!answer) {
      errorCount += 1;
      errors.push({ line: index + 1, content: line, reason: '答え漢字が空です' });
      continue;
    }

    // 処理で使う値を準備する
    const key = `${question}|${answer}`;
    // 条件に応じて処理を分岐する
    if (existingKey.has(key) || seenKey.has(key)) {
      duplicateCount += 1;
      continue;
    }
    seenKey.add(key);

    validRows.push({
      lineNumber: index + 1,
      content: line,
      question,
      answer,
      histories: parsed.histories,
      wordId: createUuid(),
    });
  }

  const wordMasterItems: WordMasterTable[] = [];
  const candidatesToCreate: ExamCandidateTable[] = [];
  const candidateTargetsToDelete: Array<{ subject: SubjectId; targetId: string }> = [];

  // 処理で使う値を準備する
  const modelId = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';
  // 処理で使う値を準備する
  const batchSize = 100;
  // 対象データを順番に処理する
  for (let start = 0; start < validRows.length; start += batchSize) {
    // 処理で使う値を準備する
    const batch = validRows.slice(start, start + batchSize);

    let bulkGenerated: { items: Array<{ id: string; readingHiragana: string }> };
    // 例外が発生しうる処理を実行する
    try {
      // 値を代入する
      bulkGenerated = await repositories.bedrock.generateKanjiQuestionReadingsBulk({
        items: batch.map((r) => ({ id: r.wordId, question: r.question, answer: r.answer })),
        modelId,
      });
    } catch (e) {
      // 処理で使う値を準備する
      const message = e instanceof Error ? e.message : 'Unknown error';
      // 対象データを順番に処理する
      for (const row of batch) {
        errorCount += 1;
        errors.push({ line: row.lineNumber, content: row.content, reason: `読み生成に失敗しました: ${message}` });
      }
      continue;
    }

    // 処理で使う値を準備する
    const byId = new Map(bulkGenerated.items.map((x) => [String(x.id ?? ''), x] as const));
    // 対象データを順番に処理する
    for (const row of batch) {
      // 処理で使う値を準備する
      const raw = byId.get(row.wordId);
      // 条件に応じて処理を分岐する
      if (!raw) {
        errorCount += 1;
        errors.push({
          line: row.lineNumber,
          content: row.content,
          reason: '読み生成に失敗しました: 結果が返りませんでした',
        });
        continue;
      }

      // 例外が発生しうる処理を実行する
      try {
        // 処理で使う値を準備する
        const computed = computeKanjiQuestionFields({
          question: row.question,
          readingHiragana: String(raw.readingHiragana ?? '').trim(),
        });

        wordMasterItems.push({
          wordId: row.wordId,
          subject,
          question: row.question,
          answer: row.answer,
          readingHiragana: computed.readingHiragana,
          underlineSpec: computed.underlineSpec,
        });

        // 条件に応じて処理を分岐する
        if (row.histories.length > 0) {
          candidateTargetsToDelete.push({ subject, targetId: row.wordId });
          candidatesToCreate.push(
            ...buildCandidatesFromHistories({
              subject,
              targetWordId: row.wordId,
              histories: row.histories,
              finalStatus: 'AUTO',
            }),
          );
        } else {
          candidatesToCreate.push(
            buildCandidateRow({
              subject,
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
        // 処理で使う値を準備する
        const message = e instanceof Error ? e.message : 'Unknown error';
        errorCount += 1;
        errors.push({ line: row.lineNumber, content: row.content, reason: `読み生成に失敗しました: ${message}` });
        continue;
      }
    }
  }

  // 非同期処理の完了を待つ
  await repositories.wordMaster.bulkCreate(wordMasterItems);

  // 条件に応じて処理を分岐する
  if (candidateTargetsToDelete.length > 0) {
    // 非同期処理の完了を待つ
    await Promise.all(
      candidateTargetsToDelete.map(async (t) => {
        // 非同期処理の完了を待つ
        await repositories.examCandidates.deleteCandidatesByTargetId({
          subject: t.subject,
          targetId: t.targetId,
        });
      }),
    );
  }
  // 非同期処理の完了を待つ
  await repositories.examCandidates.bulkCreateCandidates(candidatesToCreate);

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
