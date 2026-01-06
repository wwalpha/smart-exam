import { dbHelper } from '@/lib/aws';
import type { ReviewTest } from '@smart-exam/api-types';
import type { ReviewTestTable } from '@/types/db';
import { TABLE_REVIEW_TESTS, toApiReviewTest } from './internal';

export const listReviewTests = async (): Promise<ReviewTest[]> => {
  const result = await dbHelper.scan<ReviewTestTable>({ TableName: TABLE_REVIEW_TESTS });
  const items = result.Items ?? [];

  // stable ordering: createdDate desc then testId desc
  items.sort((a, b) => {
    if (a.createdDate !== b.createdDate) return a.createdDate < b.createdDate ? 1 : -1;
    return a.testId < b.testId ? 1 : -1;
  });

  return items.map(toApiReviewTest);
};
