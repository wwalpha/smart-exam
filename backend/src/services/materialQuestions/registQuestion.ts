import type { Question } from '@smart-exam/api-types';

import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialQuestionsTable } from '@/types/db';

import type { MaterialQuestionsService } from './materialQuestions.types';
import { toSortNumber } from './toSortNumber';

const registQuestionImpl = async (
  repositories: Repositories,
  data: Parameters<MaterialQuestionsService['registQuestion']>[0],
): Promise<Question> => {
  const id = createUuid();

  const dbItem: MaterialQuestionsTable = {
    questionId: id,
    materialId: data.materialId,
    subjectId: data.subject,
    number: toSortNumber(data.canonicalKey),
    canonicalKey: data.canonicalKey,
  };

  await repositories.materialQuestions.create(dbItem);
  await repositories.materials.incrementQuestionCount(data.materialId, 1);

  return {
    id,
    canonicalKey: data.canonicalKey,
    subject: data.subject,
    materialId: data.materialId,
    tags: data.tags,
  };
};

export const createRegistQuestion = (
  repositories: Repositories,
): MaterialQuestionsService['registQuestion'] => {
  return registQuestionImpl.bind(null, repositories);
};
