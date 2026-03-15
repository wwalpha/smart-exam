import type { ExamMode, SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamCandidateTable } from '@/types/db';

import { normalizeCandidate, type ExamCandidateTableRaw } from './normalizeCandidate';
import { toCandidateKeyUpperBound } from './toCandidateKeyUpperBound';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;

export const listCandidates = async (params: {
  subject?: SubjectId;
  mode?: ExamMode;
  nextTime?: string;
}): Promise<ExamCandidateTable[]> => {
  const expAttrNames: Record<string, string> = {
    '#status': 'status',
    ...(params.nextTime && params.subject ? { '#candidateKey': 'candidateKey' } : {}),
    ...(params.nextTime && !params.subject ? { '#nextTime': 'nextTime' } : {}),
    ...(params.mode ? { '#mode': 'mode' } : {}),
  };
  const expAttrValues: Record<string, unknown> = {
    ':open': 'OPEN',
    ...(params.nextTime && params.subject ? { ':upper': toCandidateKeyUpperBound(params.nextTime) } : {}),
    ...(params.nextTime && !params.subject ? { ':nextTime': params.nextTime } : {}),
    ...(params.mode ? { ':mode': params.mode } : {}),
  };
  const filterConditions = [params.nextTime && !params.subject ? '#nextTime <= :nextTime' : null, '#status = :open', params.mode ? '#mode = :mode' : null].filter(
    (value): value is string => value !== null,
  );
  const filterExp = filterConditions.join(' AND ');

  if (params.subject) {
    const keyConditionExpression = params.nextTime
      ? '#subject = :subject AND #candidateKey <= :upper'
      : '#subject = :subject';
    const result = await dbHelper.query<ExamCandidateTableRaw>({
      TableName: TABLE_NAME,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeNames: {
        '#subject': 'subject',
        ...expAttrNames,
      },
      ExpressionAttributeValues: {
        ':subject': params.subject,
        ...expAttrValues,
      },
      ...(filterExp ? { FilterExpression: filterExp } : {}),
    });

    return (result.Items ?? []).map(normalizeCandidate);
  }

  const result = await dbHelper.scan<ExamCandidateTableRaw>({
    TableName: TABLE_NAME,
    ExpressionAttributeNames: expAttrNames,
    ExpressionAttributeValues: expAttrValues,
    ...(filterExp ? { FilterExpression: filterExp } : {}),
  });

  return (result.Items ?? []).map(normalizeCandidate);
};
