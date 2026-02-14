// Module: createReviewAttemptsService responsibilities.

import type { ReviewAttempt, ReviewTargetType, SubjectId } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ReviewTestTable } from '@/types/db';


const toAttemptedAt = (dateYmd: string): string => `${dateYmd}T00:00:00.000Z`;

const getAttemptFromTest = (params: {
  test: ReviewTestTable;
  targetType: ReviewTargetType;
  targetId: string;
}): ReviewAttempt | null => {
  const { test, targetType, targetId } = params;
  if (test.mode !== targetType) return null;
  if (!Array.isArray(test.questions) || !test.questions.includes(targetId)) return null;

  const dateYmd = test.submittedDate ?? test.createdDate;
  const isCorrect = (test.results ?? []).find((r) => r.id === targetId)?.isCorrect;
  if (typeof isCorrect !== 'boolean') return null;

  return {
    targetType,
    targetId,
    subject: test.subject,
    dateYmd,
    attemptedAt: toAttemptedAt(dateYmd),
    isCorrect,
    reviewTestId: test.testId,
  };
};

/** Type definition for ReviewAttemptsService. */
export type ReviewAttemptsService = {
  listReviewAttempts: (params: {
    targetType: ReviewTargetType;
    targetId: string;
    subject?: SubjectId;
  }) => Promise<ReviewAttempt[]>;
};

/** Creates review attempts service. */
export const createReviewAttemptsService = (repositories: Repositories): ReviewAttemptsService => {
  const listReviewAttempts: ReviewAttemptsService['listReviewAttempts'] = async (params) => {
    const items: ReviewTestTable[] = await repositories.reviewTests.scanAll();

    const filtered = items
      .filter((t) => {
        if (params.subject && t.subject !== params.subject) return false;
        return true;
      })
      .map((test) => getAttemptFromTest({ test, targetType: params.targetType, targetId: params.targetId }))
      .filter((x): x is ReviewAttempt => Boolean(x));

    // stable ordering: date desc then testId desc
    filtered.sort((a, b) => {
      if (a.dateYmd !== b.dateYmd) return a.dateYmd < b.dateYmd ? 1 : -1;
      if ((a.reviewTestId ?? '') !== (b.reviewTestId ?? ''))
        return (a.reviewTestId ?? '') < (b.reviewTestId ?? '') ? 1 : -1;
      return a.attemptedAt < b.attemptedAt ? 1 : -1;
    });

    return filtered;
  };

  return { listReviewAttempts };
};
