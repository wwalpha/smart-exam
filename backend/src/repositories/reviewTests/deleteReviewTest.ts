import { dbHelper } from '@/lib/aws';
import { getReviewTestRow, TABLE_REVIEW_TESTS, TABLE_REVIEW_TEST_CANDIDATES } from './internal';

export const deleteReviewTest = async (testId: string): Promise<boolean> => {
  const existing = await getReviewTestRow(testId);
  if (!existing) return false;

  const items = Array.isArray(existing.items) ? existing.items : [];
  await Promise.all(
    items.map(async (i) => {
      try {
        await dbHelper.update({
          TableName: TABLE_REVIEW_TEST_CANDIDATES,
          Key: { subject: existing.subject, questionId: i.targetId },
          ConditionExpression: '#testId = :testId',
          UpdateExpression: 'REMOVE #testId',
          ExpressionAttributeNames: { '#testId': 'testId' },
          ExpressionAttributeValues: { ':testId': testId },
        });
      } catch (e: unknown) {
        const name = (e as { name?: string } | null)?.name;
        if (name === 'ConditionalCheckFailedException') return;
        throw e;
      }
    })
  );

  await dbHelper.delete({ TableName: TABLE_REVIEW_TESTS, Key: { testId } });

  return true;
};
