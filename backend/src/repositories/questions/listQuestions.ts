import { QuestionsService } from '@/services/QuestionsService';
import type { Question } from '@/repositories/repo.types';

export const listQuestions = async (materialSetId: string): Promise<Question[]> => {
  const items = await QuestionsService.listByMaterialId(materialSetId);

  return items.map((dbItem) => ({
    id: dbItem.questionId,
    materialSetId: dbItem.materialId,
    canonicalKey: dbItem.canonicalKey,
    subject: dbItem.subjectId,
  }));
};
