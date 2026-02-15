import type { ReviewMode, SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamCandidateTable } from '@/types/db';

import { normalizeCandidate, type ExamCandidateTableRaw } from './normalizeCandidate';
import { toCandidateKeyUpperBound } from './toCandidateKeyUpperBound';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;
const INDEX_GSI_SUBJECT_NEXT_TIME = 'gsi_subject_next_time';

export const listDueCandidates = async (params: {
  subject: SubjectId;
  mode?: ReviewMode;
  todayYmd: string;
}): Promise<ExamCandidateTable[]> => {
  const expNames: Record<string, string> = {
    '#subject': 'subject',
    '#candidateKey': 'candidateKey',
    '#status': 'status',
    ...(params.mode ? { '#mode': 'mode' } : {}),
  };
  const expValues: Record<string, unknown> = {
    ':subject': params.subject,
    ':upper': toCandidateKeyUpperBound(params.todayYmd),
    ':open': 'OPEN',
    ...(params.mode ? { ':mode': params.mode } : {}),
  };

  const result = await dbHelper.query<ExamCandidateTableRaw>({
    TableName: TABLE_NAME,
    IndexName: INDEX_GSI_SUBJECT_NEXT_TIME,
    KeyConditionExpression: '#subject = :subject AND #candidateKey <= :upper',
    ExpressionAttributeNames: expNames,
    ExpressionAttributeValues: expValues,
    FilterExpression: params.mode ? '#status = :open AND #mode = :mode' : '#status = :open',
    ScanIndexForward: true,
  });

  return (result.Items ?? []).map(normalizeCandidate);
};
