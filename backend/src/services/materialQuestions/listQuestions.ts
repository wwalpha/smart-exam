import type { Question } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialQuestionsService } from './materialQuestions.types';

const listQuestionsImpl = async (repositories: Repositories, materialId: string): Promise<Question[]> => {
  const rows = await repositories.materialQuestions.listByMaterialId(materialId);
  return rows.map((row) => ({
    id: row.questionId,
    canonicalKey: row.canonicalKey,
    subject: row.subjectId,
    materialId: row.materialId,
    choice: row.choice,
    tags: [],
  }));
};

export const createListQuestions = (repositories: Repositories): MaterialQuestionsService['listQuestions'] => {
  return listQuestionsImpl.bind(null, repositories);
};
