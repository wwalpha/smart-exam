import { dbHelper } from '@/lib/aws';
import type { ReviewTest } from '@smart-exam/api-types';
import type { UpdateReviewTestStatusRequest } from '@smart-exam/api-types';
import type { ReviewTestTable } from '@/types/db';
import { getReviewTestRow, TABLE_REVIEW_TESTS, toApiReviewTest } from './internal';

export const updateReviewTestStatus = async (testId: string, req: UpdateReviewTestStatusRequest): Promise<ReviewTest | null> => {
  const existing = await getReviewTestRow(testId);
  if (!existing) return null;

  const result = await dbHelper.update({
    TableName: TABLE_REVIEW_TESTS,
    Key: { testId },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':status': req.status },
    ReturnValues: 'ALL_NEW',
  });

  return result.Attributes ? toApiReviewTest(result.Attributes as ReviewTestTable) : null;
};
