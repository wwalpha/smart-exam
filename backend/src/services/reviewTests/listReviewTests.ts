import type { ReviewTest } from '@smart-exam/api-types';
import type { ReviewTestTable } from '@/types/db';
import { toApiReviewTest } from './internal';
import { ReviewTestsService } from '@/services';

export const listReviewTests = async (): Promise<ReviewTest[]> => {
  const items: ReviewTestTable[] = await ReviewTestsService.scanAll();

  // stable ordering: createdDate desc then testId desc
  items.sort((a, b) => {
    if (a.createdDate !== b.createdDate) return a.createdDate < b.createdDate ? 1 : -1;
    return a.testId < b.testId ? 1 : -1;
  });

  return items.map(toApiReviewTest);
};
