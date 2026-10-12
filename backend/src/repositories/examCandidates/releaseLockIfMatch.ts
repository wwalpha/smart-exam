import type { SubjectId } from '@smart-exam/api-types';

import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamCandidateTable } from '@/types/db';
import { get } from '@/repositories/materialQuestions/get';
import { requireMaterialReviewCount } from '@/lib/materialReviewPolicy';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;

export const releaseLockIfMatch = async (params: {
  subject: SubjectId;
  candidateKey: string;
  examId: string;
}): Promise<boolean> => {
  try {
    const row = await dbHelper.get<ExamCandidateTable>({ TableName: TABLE_NAME, Key: { subject: params.subject, candidateKey: params.candidateKey }, ConsistentRead: true });
    if (row?.Item?.mode === 'MATERIAL') {
      const question = await get(row.Item.questionId);
      const allowed = question && requireMaterialReviewCount(question) < 5;
      await dbHelper.transactWrite({ TransactItems: [
        { ConditionCheck: {
          TableName: ENV.TABLE_MATERIAL_QUESTIONS, Key: { questionId: row.Item.questionId },
          ConditionExpression: question ? 'reviewPolicyVersion = :version AND reviewCount = :count' : 'attribute_not_exists(questionId)',
          ...(question ? { ExpressionAttributeValues: { ':version': 2, ':count': question.reviewCount } } : {}),
        } },
        allowed ? { Update: {
          TableName: TABLE_NAME, Key: { subject: params.subject, candidateKey: params.candidateKey },
          ConditionExpression: 'examId = :examId', UpdateExpression: 'REMOVE examId SET #status = :open',
          ExpressionAttributeNames: { '#status': 'status' }, ExpressionAttributeValues: { ':examId': params.examId, ':open': 'OPEN' },
        } } : { Delete: {
          TableName: TABLE_NAME, Key: { subject: params.subject, candidateKey: params.candidateKey },
          ConditionExpression: 'examId = :examId', ExpressionAttributeValues: { ':examId': params.examId },
        } },
      ] });
      return true;
    }
    await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, candidateKey: params.candidateKey },
      ConditionExpression: '#examId = :examId',
      UpdateExpression: 'REMOVE #examId SET #status = :open',
      ExpressionAttributeNames: { '#examId': 'examId', '#status': 'status' },
      ExpressionAttributeValues: { ':examId': params.examId, ':open': 'OPEN' },
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
