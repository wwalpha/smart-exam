import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialQuestionsService } from './materialQuestions.types';

export const createListQuestions = (repositories: Repositories): MaterialQuestionsService['listQuestions'] => {
  return async (materialId) => {
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
};
