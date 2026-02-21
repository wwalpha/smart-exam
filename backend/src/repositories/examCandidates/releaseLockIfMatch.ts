import type { SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;

export const releaseLockIfMatch = async (params: {
  subject: SubjectId;
  candidateKey: string;
  examId: string;
}): Promise<boolean> => {
  try {
    await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, candidateKey: params.candidateKey },
      ConditionExpression: '#examId = :examId',
      UpdateExpression: 'REMOVE #examId SET #status = :open',
      ExpressionAttributeNames: { '#examId': 'examId', '#status': 'status' },
      ExpressionAttributeValues: { ':examId': params.examId, ':open': 'OPEN' },
    });
    return true;
  } catch (error: unknown) {
    const name = (error as { name?: string } | null)?.name;
    if (name === 'ConditionalCheckFailedException') {
      return false;
    }
    throw error;
  }
};
