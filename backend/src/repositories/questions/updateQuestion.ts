import { QuestionsService } from '@/services/QuestionsService';
import type { Question } from '@/repositories/repo.types';
import type { UpdateQuestionRequest } from '@/repositories/repo.types';
import { toSortNumber } from './toSortNumber';

export const updateQuestion = async (id: string, data: UpdateQuestionRequest): Promise<Question | null> => {
  const result = await QuestionsService.update(id, {
    ...(typeof data.canonicalKey === 'string' ? { number: toSortNumber(data.canonicalKey) } : {}),
    ...data,
  });

  if (!result) return null;

  const dbItem = result;
  return {
    id: dbItem.questionId,
    materialSetId: dbItem.materialId,
    canonicalKey: dbItem.canonicalKey,
    subject: dbItem.subjectId,
  };
};
