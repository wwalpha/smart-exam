import type { SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;

export const lockCandidateIfUnlocked = async (params: {
  subject: SubjectId;
  candidateKey: string;
  testId: string;
  status?: 'LOCKED';
}): Promise<void> => {
  await dbHelper.update({
    TableName: TABLE_NAME,
    Key: { subject: params.subject, candidateKey: params.candidateKey },
    ConditionExpression: 'attribute_not_exists(#testId)',
    UpdateExpression: 'SET #testId = :testId, #status = :status',
    ExpressionAttributeNames: { '#testId': 'testId', '#status': 'status' },
    ExpressionAttributeValues: { ':testId': params.testId, ':status': params.status ?? 'LOCKED' },
  });
};
