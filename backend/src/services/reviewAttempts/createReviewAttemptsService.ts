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
  const listReviewAttempts = createListReviewAttempts(repositories);

  return { listReviewAttempts };
};
