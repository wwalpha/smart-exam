import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { MaterialQuestionsTable } from '@/types/db';

// Existing records must use partial updates so persisted counters cannot be erased.
export const create = async (item: MaterialQuestionsTable): Promise<void> => {
  const initial = { ...item, reviewCount: 0, reviewPolicyVersion: 2 };
  delete initial.countedExamIds;
  delete initial.reviewCandidateKey;
  await dbHelper.put({
    TableName: ENV.TABLE_MATERIAL_QUESTIONS,
    Item: initial,
    ConditionExpression: 'attribute_not_exists(questionId)',
  });
};
