import type { Question } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialQuestionsService } from './materialQuestions.types';

const getQuestionImpl = async (repositories: Repositories, questionId: string): Promise<Question | null> => {
  const row = await repositories.materialQuestions.get(questionId);
  if (!row) return null;

  return {
    id: row.questionId,
    canonicalKey: row.canonicalKey,
    subject: row.subjectId,
    materialId: row.materialId,
    tags: [],
  };
};

export const createGetQuestion = (repositories: Repositories): MaterialQuestionsService['getQuestion'] => {
  return getQuestionImpl.bind(null, repositories);
};
