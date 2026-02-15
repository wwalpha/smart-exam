import type { SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;

export const releaseLockIfMatch = async (params: {
  subject: SubjectId;
  candidateKey: string;
  testId: string;
}): Promise<void> => {
  await dbHelper.update({
    TableName: TABLE_NAME,
    Key: { subject: params.subject, candidateKey: params.candidateKey },
    ConditionExpression: '#testId = :testId',
    UpdateExpression: 'REMOVE #testId SET #status = :open',
    ExpressionAttributeNames: { '#testId': 'testId', '#status': 'status' },
    ExpressionAttributeValues: { ':testId': params.testId, ':open': 'OPEN' },
  });
};
