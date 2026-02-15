import type { SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;

export const lockCandidateIfUnlocked = async (params: {
  subject: SubjectId;
  candidateKey: string;
  examId: string;
  status?: 'LOCKED';
}): Promise<void> => {
  await dbHelper.update({
    TableName: TABLE_NAME,
    Key: { subject: params.subject, candidateKey: params.candidateKey },
    ConditionExpression: 'attribute_not_exists(#examId)',
    UpdateExpression: 'SET #examId = :examId, #status = :status',
    ExpressionAttributeNames: { '#examId': 'examId', '#status': 'status' },
    ExpressionAttributeValues: { ':examId': params.examId, ':status': params.status ?? 'LOCKED' },
  });
};
