import type { ReviewTestDetail } from '@smart-exam/api-types';
import { toApiReviewTest, toApiReviewTestItem } from './internal';
import { ReviewTestsService } from '@/services/ReviewTestsService';

export const getReviewTest = async (testId: string): Promise<ReviewTestDetail | null> => {
  const test = await ReviewTestsService.get(testId);
  if (!test) return null;

  const itemRows = (test.items ?? []).slice().sort((a, b) => a.order - b.order);

  return {
    ...toApiReviewTest(test),
    items: itemRows.map((r) => toApiReviewTestItem(testId, r)),
  };
};
