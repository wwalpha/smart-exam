import { QuestionsService } from '@/services/QuestionsService';
import type { MaterialQuestionTable } from '@/types/db';
import type { CreateQuestionRequest, Question } from '@/repositories/repo.types';
import { createUuid } from '@/lib/uuid';
import { toSortNumber } from './toSortNumber';
import { MaterialsService } from '@/services/MaterialsService';

export const createQuestion = async (data: CreateQuestionRequest & { materialId: string }): Promise<Question> => {
  const id = createUuid();

  const item: Question = {
    id,
    ...data,
  };

  const dbItem: MaterialQuestionTable = {
    questionId: id,
    materialId: data.materialId,
    subjectId: data.subject,
    number: toSortNumber(data.canonicalKey),
    canonicalKey: data.canonicalKey,
  };

  await QuestionsService.create(dbItem);

  await MaterialsService.incrementQuestionCount(data.materialId, 1);

  return item;
};
