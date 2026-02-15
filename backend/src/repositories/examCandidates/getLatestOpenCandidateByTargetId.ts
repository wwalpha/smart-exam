import type { SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamCandidateTable } from '@/types/db';

import { normalizeCandidate, type ExamCandidateTableRaw } from './normalizeCandidate';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;
const INDEX_GSI_QUESTION_ID_CREATED_AT = 'gsi_question_id_created_at';

export const getLatestOpenCandidateByTargetId = async (params: {
  subject: SubjectId;
  targetId: string;
}): Promise<ExamCandidateTable | null> => {
  const result = await dbHelper.query<ExamCandidateTableRaw>({
    TableName: TABLE_NAME,
    IndexName: INDEX_GSI_QUESTION_ID_CREATED_AT,
    KeyConditionExpression: '#questionId = :questionId',
    ExpressionAttributeNames: { '#questionId': 'questionId' },
    ExpressionAttributeValues: { ':questionId': params.targetId },
    ScanIndexForward: false,
    Limit: 20,
  });

  const items = (result.Items ?? []).map(normalizeCandidate);
  return items.find((x) => x.subject === params.subject && x.status === 'OPEN') ?? null;
};
