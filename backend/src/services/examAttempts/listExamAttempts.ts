import type { ExamAttempt, ExamTargetType } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamTable } from '@/types/db';

import type { ExamAttemptsService } from './createExamAttemptsService';

// 内部で利用する補助処理を定義する
const toAttemptedAt = (dateYmd: string): string => `${dateYmd}T00:00:00.000Z`;

// 内部で利用する補助処理を定義する
const getAttemptFromTest = (params: {
  test: ExamTable;
  targetIds: string[];
  targetType: ExamTargetType;
  targetId: string;
}): ExamAttempt | null => {
  const { test, targetIds, targetType, targetId } = params;
  // 条件に応じて処理を分岐する
  if (test.mode !== targetType) return null;
  // 条件に応じて処理を分岐する
  if (!targetIds.includes(targetId)) return null;

  // 処理で使う値を準備する
  const dateYmd = test.submittedDate ?? test.createdDate;
  // 処理で使う値を準備する
  const isCorrect = (test.results ?? []).find((r) => r.id === targetId)?.isCorrect;
  // 条件に応じて処理を分岐する
  if (typeof isCorrect !== 'boolean') return null;

  // 処理結果を呼び出し元へ返す
  return {
    targetType,
    targetId,
    subject: test.subject,
    dateYmd,
    attemptedAt: toAttemptedAt(dateYmd),
    isCorrect,
    examId: test.examId,
  };
};

const listExamAttemptsImpl = async (
  repositories: Repositories,
  params: Parameters<ExamAttemptsService['listExamAttempts']>[0],
): Promise<ExamAttempt[]> => {
  const items: ExamTable[] = await repositories.exams.scanAll();

  const detailsByExamId = new Map<string, string[]>();
  await Promise.all(
    items.map(async (test) => {
      const details = await repositories.examDetails.listByExamId(test.examId);
      detailsByExamId.set(
        test.examId,
        details.map((detail) => detail.targetId),
      );
    }),
  );

  const filtered = items
    .filter((t) => {
      if (params.subject && t.subject !== params.subject) return false;
      return true;
    })
    .map((test) =>
      getAttemptFromTest({
        test,
        targetIds: detailsByExamId.get(test.examId) ?? [],
        targetType: params.targetType,
        targetId: params.targetId,
      }),
    )
    .filter((x): x is ExamAttempt => Boolean(x));

  filtered.sort((a, b) => {
    if (a.dateYmd !== b.dateYmd) return a.dateYmd < b.dateYmd ? 1 : -1;
    if ((a.examId ?? '') !== (b.examId ?? '')) return (a.examId ?? '') < (b.examId ?? '') ? 1 : -1;
    return a.attemptedAt < b.attemptedAt ? 1 : -1;
  });

  return filtered;
};

export const createListExamAttempts = (repositories: Repositories): ExamAttemptsService['listExamAttempts'] => {
  return listExamAttemptsImpl.bind(null, repositories);
};
