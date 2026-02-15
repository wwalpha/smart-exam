import { createUuid } from '@/lib/uuid';
import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ReviewMode, SubjectId } from '@smart-exam/api-types';
import type { ExamCandidateTable } from '@/types/db';

import { nowIso } from './nowIso';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;

export const createCandidate = async (params: {
  subject: SubjectId;
  questionId: string;
  mode: ReviewMode;
  nextTime: string;
  correctCount: number;
  status: 'OPEN' | 'EXCLUDED' | 'CLOSED';
  createdAtIso?: string;
}): Promise<ExamCandidateTable> => {
  const id = createUuid();
  const createdAt = params.createdAtIso ?? nowIso();
  const candidateKey = `${params.nextTime}#${id}`;

  const item: ExamCandidateTable = {
    subject: params.subject,
    candidateKey,
    id,
    questionId: params.questionId,
    mode: params.mode,
    status: params.status,
    correctCount: Math.max(0, Math.trunc(params.correctCount)),
    nextTime: params.nextTime,
    createdAt,
  };

  await dbHelper.put({
    TableName: TABLE_NAME,
    Item: item,
    ConditionExpression: 'attribute_not_exists(#subject) AND attribute_not_exists(#candidateKey)',
    ExpressionAttributeNames: { '#subject': 'subject', '#candidateKey': 'candidateKey' },
  });

  return item;
};
