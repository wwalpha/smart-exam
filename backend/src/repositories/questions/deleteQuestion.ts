import { QuestionsService } from '@/services/QuestionsService';

export const deleteQuestion = async (id: string): Promise<void> => {
  await QuestionsService.delete(id);
};
