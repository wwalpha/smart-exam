import type { Question } from '@smart-exam/api-types';

import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialQuestionTable } from '@/types/db';

import type { QuestionsService } from './createQuestionsService';
import { toSortNumber } from './toSortNumber';

export const createCreateQuestion = (repositories: Repositories): QuestionsService['createQuestion'] => {
  return async (data): Promise<Question> => {
    const id = createUuid();

    const dbItem: MaterialQuestionTable = {
      questionId: id,
      materialId: data.materialId,
      subjectId: data.subject,
      number: toSortNumber(data.canonicalKey),
      canonicalKey: data.canonicalKey,
    };

    await repositories.questions.create(dbItem);
    await repositories.materials.incrementQuestionCount(data.materialId, 1);

    const item: Question = {
      id,
      ...data,
    };

    return item;
  };
};
