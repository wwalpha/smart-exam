import { QuestionsService } from '@/services/QuestionsService';
import { MaterialsService } from '@/services/MaterialsService';

export const deleteQuestion = async (id: string): Promise<void> => {
  const existing = await QuestionsService.get(id);
  await QuestionsService.delete(id);

  if (existing?.materialId) {
    await MaterialsService.incrementQuestionCount(existing.materialId, -1);
  }
};
