import type { ReviewAttempt, ReviewTargetType, SubjectId } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamTable } from '@/types/db';

import type { ReviewAttemptsService } from './createReviewAttemptsService';

// 内部で利用する補助処理を定義する
const toAttemptedAt = (dateYmd: string): string => `${dateYmd}T00:00:00.000Z`;

// 内部で利用する補助処理を定義する
const getAttemptFromTest = (params: {
  test: ExamTable;
  targetType: ReviewTargetType;
  targetId: string;
}): ReviewAttempt | null => {
  const { test, targetType, targetId } = params;
  // 条件に応じて処理を分岐する
  if (test.mode !== targetType) return null;
  // 条件に応じて処理を分岐する
  if (!Array.isArray(test.questions) || !test.questions.includes(targetId)) return null;

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
    examId: test.testId,
  };
};

// 公開するサービス処理を定義する
export const createListReviewAttempts = (repositories: Repositories): ReviewAttemptsService['listReviewAttempts'] => {
  // 処理結果を呼び出し元へ返す
  return async (params: { targetType: ReviewTargetType; targetId: string; subject?: SubjectId }) => {
    const items: ExamTable[] = await repositories.exams.scanAll();

    // 処理で使う値を準備する
    const filtered = items
      .filter((t) => {
        // 条件に応じて処理を分岐する
        if (params.subject && t.subject !== params.subject) return false;
        // 処理結果を呼び出し元へ返す
        return true;
      })
      .map((test) => getAttemptFromTest({ test, targetType: params.targetType, targetId: params.targetId }))
      .filter((x): x is ReviewAttempt => Boolean(x));

    // stable ordering: date desc then testId desc
    filtered.sort((a, b) => {
      // 条件に応じて処理を分岐する
      if (a.dateYmd !== b.dateYmd) return a.dateYmd < b.dateYmd ? 1 : -1;
      // 条件に応じて処理を分岐する
      if ((a.examId ?? '') !== (b.examId ?? ''))
        // 処理結果を呼び出し元へ返す
        return (a.examId ?? '') < (b.examId ?? '') ? 1 : -1;
      // 処理結果を呼び出し元へ返す
      return a.attemptedAt < b.attemptedAt ? 1 : -1;
    });

    // 処理結果を呼び出し元へ返す
    return filtered;
  };
};
