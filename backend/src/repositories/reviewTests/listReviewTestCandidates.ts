import { dbHelper } from '@/lib/aws';
import { TABLE_REVIEW_TEST_CANDIDATES } from './internal';
import type { ReviewTestCandidateTable } from '@/types/db';
import type { SubjectId } from '@smart-exam/api-types';

export const listReviewTestCandidates = async (params: {
  subject?: SubjectId;
  mode?: 'QUESTION' | 'KANJI';
}): Promise<ReviewTestCandidateTable[]> => {
  if (params.subject) {
    const result = await dbHelper.query<ReviewTestCandidateTable>({
      TableName: TABLE_REVIEW_TEST_CANDIDATES,
      KeyConditionExpression: '#subject = :subject',
      ExpressionAttributeNames: {
        '#subject': 'subject',
        ...(params.mode ? { '#mode': 'mode' } : {}),
      },
      ExpressionAttributeValues: {
        ':subject': params.subject,
        ...(params.mode ? { ':mode': params.mode } : {}),
      },
      ...(params.mode
        ? {
            FilterExpression: '#mode = :mode',
          }
        : {}),
    });

    return result.Items ?? [];
  }

  const result = await dbHelper.scan<ReviewTestCandidateTable>({
    TableName: TABLE_REVIEW_TEST_CANDIDATES,
    ...(params.mode
      ? {
          FilterExpression: '#mode = :mode',
          ExpressionAttributeNames: { '#mode': 'mode' },
          ExpressionAttributeValues: { ':mode': params.mode },
        }
      : {}),
  });

  return result.Items ?? [];
};
