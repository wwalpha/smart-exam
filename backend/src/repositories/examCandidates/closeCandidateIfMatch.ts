import type { SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import type { ExamCandidateTableRaw } from '@/repositories/examCandidates/normalizeCandidate';
import { normalizeCandidate } from '@/repositories/examCandidates/normalizeCandidate';
import type { ExamHistoryTable } from '@/types/db';

const CANDIDATES_TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;
const HISTORIES_TABLE_NAME = ENV.TABLE_EXAM_HISTORIES;

export const closeCandidateIfMatch = async (params: {
  subject: SubjectId;
  candidateKey: string;
  expectedExamId?: string;
}): Promise<void> => {
  const current = await dbHelper.get<ExamCandidateTableRaw>({
    TableName: CANDIDATES_TABLE_NAME,
    Key: { subject: params.subject, candidateKey: params.candidateKey },
  });

  if (!current?.Item) {
    return;
  }

  const candidate = normalizeCandidate(current.Item);
  if (params.expectedExamId && candidate.examId !== params.expectedExamId) {
    const error = new Error('examId does not match expectedExamId');
    (error as Error & { name: string }).name = 'ConditionalCheckFailedException';
    throw error;
  }

  const closedAt = DateUtils.now();
  const historyItem: ExamHistoryTable = {
    subject: candidate.subject,
    candidateKey: candidate.candidateKey,
    id: candidate.id,
    questionId: candidate.questionId,
    mode: candidate.mode,
    status: 'CLOSED',
    correctCount: candidate.correctCount,
    nextTime: candidate.nextTime,
    closedAt,
  };

  try {
    await dbHelper.put({
      TableName: HISTORIES_TABLE_NAME,
      Item: historyItem,
      ConditionExpression: 'attribute_not_exists(#subject) AND attribute_not_exists(#candidateKey)',
      ExpressionAttributeNames: {
        '#subject': 'subject',
        '#candidateKey': 'candidateKey',
      },
    });
  } catch (e: unknown) {
    const name = (e as { name?: string } | null)?.name;
    if (name !== 'ConditionalCheckFailedException') {
      throw e;
    }
  }

  try {
    await dbHelper.delete({
      TableName: CANDIDATES_TABLE_NAME,
      Key: { subject: params.subject, candidateKey: params.candidateKey },
      ...(params.expectedExamId
        ? {
            ConditionExpression: '#examId = :examId',
            ExpressionAttributeNames: { '#examId': 'examId' },
            ExpressionAttributeValues: { ':examId': params.expectedExamId },
          }
        : {}),
    });
  } catch (e: unknown) {
    const name = (e as { name?: string } | null)?.name;
    if (name !== 'ConditionalCheckFailedException') {
      throw e;
    }
  }
};
