import type { Repositories } from '@/repositories/createRepositories';

import { createDeleteQuestion } from './deleteQuestion';
import { createGetQuestion } from './getQuestion';
import { createListQuestions } from './listQuestions';
import { createRegistQuestion } from './registQuestion';
import type { MaterialQuestionsService } from './materialQuestions.types';
import { createUpdateQuestion } from './updateQuestion';

export const createMaterialQuestionsService = (repositories: Repositories): MaterialQuestionsService => {
  const listQuestions = createListQuestions(repositories);
  const registQuestion = createRegistQuestion(repositories);
  const getQuestion = createGetQuestion(repositories);
  const updateQuestion = createUpdateQuestion(repositories);
  const deleteQuestion = createDeleteQuestion(repositories);

  return {
    listQuestions,
    registQuestion,
    getQuestion,
    updateQuestion,
    deleteQuestion,
  };
};

export { createMaterialQuestionsService as materialQuestionsService };
export type { MaterialQuestionsService } from './materialQuestions.types';
