import type { SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

import { nowIso } from './nowIso';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;

export const closeCandidateIfMatch = async (params: {
  subject: SubjectId;
  candidateKey: string;
  expectedExamId?: string;
}): Promise<void> => {
  const expNames: Record<string, string> = {
    '#status': 'status',
    '#closedAt': 'closedAt',
    '#examId': 'examId',
  };
  const expValues: Record<string, unknown> = {
    ':closed': 'CLOSED',
    ':closedAt': nowIso(),
  };

  const condition = params.expectedExamId ? '#examId = :examId' : undefined;
  if (params.expectedExamId) {
    expValues[':examId'] = params.expectedExamId;
  }

  await dbHelper.update({
    TableName: TABLE_NAME,
    Key: { subject: params.subject, candidateKey: params.candidateKey },
    ...(condition ? { ConditionExpression: condition } : {}),
    UpdateExpression: 'SET #status = :closed, #closedAt = :closedAt REMOVE #examId',
    ExpressionAttributeNames: expNames,
    ExpressionAttributeValues: expValues,
  });
};
