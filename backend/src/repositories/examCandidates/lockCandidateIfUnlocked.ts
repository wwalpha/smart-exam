import type { SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamCandidateTable } from '@/types/db';
import { get } from '@/repositories/materialQuestions/get';
import { requireMaterialReviewCount } from '@/lib/materialReviewPolicy';
import { materialExistsCheck } from '@/repositories/materialReviews/candidates';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;

export const lockCandidateIfUnlocked = async (params: {
  subject: SubjectId;
  candidateKey: string;
  examId: string;
  status?: 'LOCKED';
}): Promise<boolean> => {
  try {
    const row = await dbHelper.get<ExamCandidateTable>({ TableName: TABLE_NAME, Key: { subject: params.subject, candidateKey: params.candidateKey }, ConsistentRead: true });
    if (row?.Item?.mode === 'MATERIAL') {
      const question = await get(row.Item.questionId);
      if (!question || requireMaterialReviewCount(question) >= 5) return false;
      await dbHelper.transactWrite({ TransactItems: [
        materialExistsCheck(question.materialId),
        { ConditionCheck: {
          TableName: ENV.TABLE_MATERIAL_QUESTIONS, Key: { questionId: question.questionId },
          ConditionExpression: 'reviewPolicyVersion = :version AND reviewCount < :limit AND reviewCandidateKey = :key',
          ExpressionAttributeValues: { ':version': 2, ':limit': 5, ':key': params.candidateKey },
        } },
        { Update: {
          TableName: TABLE_NAME, Key: { subject: params.subject, candidateKey: params.candidateKey },
          ConditionExpression: '#status = :open AND attribute_not_exists(examId)',
          UpdateExpression: 'SET examId = :examId, #status = :locked',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':open': 'OPEN', ':locked': 'LOCKED', ':examId': params.examId },
        } },
      ] });
      return true;
    }
    await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, candidateKey: params.candidateKey },
      ConditionExpression: 'attribute_not_exists(#examId)',
      UpdateExpression: 'SET #examId = :examId, #status = :status',
      ExpressionAttributeNames: { '#examId': 'examId', '#status': 'status' },
      ExpressionAttributeValues: { ':examId': params.examId, ':status': params.status ?? 'LOCKED' },
    });
    return true;
  } catch (error: unknown) {
    const name = (error as { name?: string } | null)?.name;
    if (name === 'ConditionalCheckFailedException' || name === 'TransactionCanceledException') {
      return false;
    }
    throw error;
  }
};
