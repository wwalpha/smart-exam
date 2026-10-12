import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { requireMaterialReviewCount } from '@/lib/materialReviewPolicy';
import { get } from '@/repositories/materialQuestions/get';
import type { ExamCandidateTable } from '@/types/db';
import type { WriteItems } from './workflow';

export const materialExistsCheck = (materialId: string): WriteItems[number] => ({
  ConditionCheck: { TableName: ENV.TABLE_MATERIALS, Key: { materialId }, ConditionExpression: 'attribute_exists(materialId)' },
});

// Use the base table for correctness; a GSI may lag behind a committed transaction.
export const listQuestionCandidates = async (subject: string, questionId: string): Promise<ExamCandidateTable[]> => {
  const result = await dbHelper.query<ExamCandidateTable>({
    TableName: ENV.TABLE_EXAM_CANDIDATES, ConsistentRead: true,
    KeyConditionExpression: '#subject = :subject', FilterExpression: 'questionId = :questionId',
    ExpressionAttributeNames: { '#subject': 'subject' },
    ExpressionAttributeValues: { ':subject': subject, ':questionId': questionId },
  });
  return result.Items ?? [];
};

export const putMaterialCandidate = async (item: ExamCandidateTable): Promise<ExamCandidateTable | null> => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const question = await get(item.questionId);
    if (!question) return null;
    const count = requireMaterialReviewCount(question);
    if (count >= 5) return null;
    const candidate = { ...item, materialId: question.materialId, subject: question.subjectId };
    if (question.reviewCandidateKey) {
      const existing = await dbHelper.get<ExamCandidateTable>({
        TableName: ENV.TABLE_EXAM_CANDIDATES, Key: { subject: question.subjectId, candidateKey: question.reviewCandidateKey }, ConsistentRead: true,
      });
      if (existing?.Item) return existing.Item;
    }
    try {
      await dbHelper.transactWrite({ TransactItems: [
        materialExistsCheck(question.materialId),
        { Update: {
          TableName: ENV.TABLE_MATERIAL_QUESTIONS, Key: { questionId: item.questionId },
          UpdateExpression: 'SET reviewCandidateKey = :key',
          ConditionExpression: `reviewPolicyVersion = :version AND reviewCount = :count AND ${question.reviewCandidateKey ? 'reviewCandidateKey = :old' : 'attribute_not_exists(reviewCandidateKey)'}`,
          ExpressionAttributeValues: { ':version': 2, ':count': count, ':key': item.candidateKey, ...(question.reviewCandidateKey ? { ':old': question.reviewCandidateKey } : {}) },
        } },
        { Put: { TableName: ENV.TABLE_EXAM_CANDIDATES, Item: candidate } },
      ] });
      return candidate;
    } catch (error) {
      if ((error as Error).name !== 'TransactionCanceledException') throw error;
      if (attempt === 4) throw error;
    }
  }
  return null;
};
