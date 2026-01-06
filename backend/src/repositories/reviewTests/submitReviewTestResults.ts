import { dbHelper } from '@/lib/aws';
import { DateUtils } from '@/lib/dateUtils';
import type { SubmitReviewTestResultsRequest } from '@smart-exam/api-types';
import { getReviewTestRow, TABLE_REVIEW_TESTS, TABLE_REVIEW_TEST_CANDIDATES } from './internal';

export const submitReviewTestResults = async (testId: string, req: SubmitReviewTestResultsRequest): Promise<boolean> => {
  const test = await getReviewTestRow(testId);
  if (!test) return false;

  const dateYmd = req.date ? DateUtils.toYmd(req.date) : DateUtils.todayYmd();

  const resultById = new Map(req.results.map((r) => [r.id, r.isCorrect] as const));

  const nextItems = (test.items ?? []).map((i) => {
    const isCorrect = resultById.get(i.targetId);
    return isCorrect === undefined ? i : { ...i, isCorrect };
  });

  const nextResults = req.results.map((r) => ({ id: r.id, isCorrect: r.isCorrect }));

  await dbHelper.put({
    TableName: TABLE_REVIEW_TESTS,
    Item: {
      ...test,
      items: nextItems,
      submittedDate: dateYmd,
      results: nextResults,
    },
  });

  const items = Array.isArray(test.items) ? test.items : [];
  await Promise.all(
    items.map(async (i) => {
      try {
        await dbHelper.update({
          TableName: TABLE_REVIEW_TEST_CANDIDATES,
          Key: { subject: test.subject, questionId: i.targetId },
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

  return true;
};
