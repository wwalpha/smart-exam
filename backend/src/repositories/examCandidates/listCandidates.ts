import type { ReviewMode, SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamCandidateTable } from '@/types/db';

import { normalizeCandidate, type ExamCandidateTableRaw } from './normalizeCandidate';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;

export const listCandidates = async (params: {
  subject?: SubjectId;
  mode?: ReviewMode;
}): Promise<ExamCandidateTable[]> => {
  const expAttrNames: Record<string, string> = {
    '#status': 'status',
    ...(params.mode ? { '#mode': 'mode' } : {}),
  };
  const expAttrValues: Record<string, unknown> = {
    ':open': 'OPEN',
    ...(params.mode ? { ':mode': params.mode } : {}),
  };
  const filterExp = params.mode ? '#status = :open AND #mode = :mode' : '#status = :open';

  if (params.subject) {
    const result = await dbHelper.query<ExamCandidateTableRaw>({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#subject = :subject',
      ExpressionAttributeNames: {
        '#subject': 'subject',
        ...expAttrNames,
      },
      ExpressionAttributeValues: {
        ':subject': params.subject,
        ...expAttrValues,
      },
      FilterExpression: filterExp,
    });

    return (result.Items ?? []).map(normalizeCandidate);
  }

  const result = await dbHelper.scan<ExamCandidateTableRaw>({
    TableName: TABLE_NAME,
    ExpressionAttributeNames: expAttrNames,
    ExpressionAttributeValues: expAttrValues,
    FilterExpression: filterExp,
  });

  return (result.Items ?? []).map(normalizeCandidate);
};
