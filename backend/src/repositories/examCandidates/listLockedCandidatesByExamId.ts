import type { SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamCandidateTable } from '@/types/db';

import { normalizeCandidate, type ExamCandidateTableRaw } from './normalizeCandidate';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;

export const listLockedCandidatesByExamId = async (params: {
  subject: SubjectId;
  examId: string;
}): Promise<ExamCandidateTable[]> => {
  const result = await dbHelper.query<ExamCandidateTableRaw>({
    TableName: TABLE_NAME,
    KeyConditionExpression: '#subject = :subject',
    ExpressionAttributeNames: {
      '#subject': 'subject',
      '#status': 'status',
      '#examId': 'examId',
    },
    ExpressionAttributeValues: {
      ':subject': params.subject,
      ':status': 'LOCKED',
      ':examId': params.examId,
    },
    FilterExpression: '#status = :status AND #examId = :examId',
  });

  return (result.Items ?? []).map(normalizeCandidate);
};
