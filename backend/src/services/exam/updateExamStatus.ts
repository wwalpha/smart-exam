import type { Repositories } from '@/repositories/createRepositories';
import type { ReviewTestTable } from '@/types/db';

import type { ReviewTestsService } from './createExamsService';
import { toApiReviewTest } from './internal';

export const createUpdateReviewTestStatus = (
  repositories: Repositories,
): ReviewTestsService['updateExamStatus'] => {
  return async (testId, req) => {
    const existing = await repositories.reviewTests.get(testId);
    if (!existing) return null;

    const updated: ReviewTestTable | null = await repositories.reviewTests.updateStatus(testId, req.status);
    return updated ? toApiReviewTest(updated) : null;
  };
};
