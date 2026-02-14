import type { QuestionListResponse } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { QuestionsService } from './createQuestionsService';

export const createListQuestions = (repositories: Repositories): QuestionsService['listQuestions'] => {
  return async (materialId): Promise<QuestionListResponse['datas']> => {
    const rows = await repositories.questions.listByMaterialId(materialId);
    return rows.map((q) => ({
      id: q.questionId,
      canonicalKey: q.canonicalKey,
      subject: q.subjectId,
      materialId: q.materialId,
      tags: [],
    }));
  };
};
