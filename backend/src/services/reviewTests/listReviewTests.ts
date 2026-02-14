import type { ReviewTest } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ReviewTestTable } from '@/types/db';

import type { ReviewTestsService } from './createReviewTestsService';
import { toApiReviewTest } from './internal';

export const createListReviewTests = (repositories: Repositories): ReviewTestsService['listReviewTests'] => {
  return async (): Promise<ReviewTest[]> => {
    const items: ReviewTestTable[] = await repositories.reviewTests.scanAll();

    // stable ordering: createdDate desc then testId desc
    items.sort((a, b) => {
      if (a.createdDate !== b.createdDate) return a.createdDate < b.createdDate ? 1 : -1;
      return a.testId < b.testId ? 1 : -1;
    });

    return items.map(toApiReviewTest);
  };
};
