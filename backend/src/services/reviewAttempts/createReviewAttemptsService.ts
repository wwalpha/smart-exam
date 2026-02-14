// Module: createReviewAttemptsService responsibilities.

import type { ReviewAttempt, ReviewTargetType, SubjectId } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import { createListReviewAttempts } from './listReviewAttempts';

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
  // 処理で使う値を準備する
  const listReviewAttempts = createListReviewAttempts(repositories);

  // 処理結果を呼び出し元へ返す
  return { listReviewAttempts };
};
