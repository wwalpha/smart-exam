import { QuestionsService } from '@/services/QuestionsService';
import type { Question } from '@/repositories/repo.types';

export const listQuestions = async (materialId: string): Promise<Question[]> => {
  const items = await QuestionsService.listByMaterialId(materialId);

  return items.map((dbItem) => ({
    id: dbItem.questionId,
    materialId: dbItem.materialId,
    canonicalKey: dbItem.canonicalKey,
    subject: dbItem.subjectId,
  }));
};
