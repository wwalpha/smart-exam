import type { Repositories } from '@/repositories/createRepositories';

import { createApplyQuestionChoicesToCandidatesForMaterial } from './applyQuestionChoicesToCandidatesForMaterial';
import { createCreateQuestion } from './createQuestion';
import { createDeleteQuestion } from './deleteQuestion';
import { createListQuestions } from './listQuestions';
import { createSearchQuestions } from './searchQuestions';
import { createSetQuestionChoice } from './setQuestionChoice';
import { createUpdateQuestion } from './updateQuestion';
import type { MaterialQuestionsService } from './materialQuestions.types';

export type { MaterialQuestionsService } from './materialQuestions.types';

export const createMaterialQuestionsService = (repositories: Repositories): MaterialQuestionsService => {
  const listQuestions = createListQuestions(repositories);
  const createQuestion = createCreateQuestion(repositories);
  const updateQuestion = createUpdateQuestion(repositories);
  const deleteQuestion = createDeleteQuestion(repositories);
  const searchQuestions = createSearchQuestions(repositories);
  const setQuestionChoice = createSetQuestionChoice(repositories);
  const applyQuestionChoicesToCandidatesForMaterial = createApplyQuestionChoicesToCandidatesForMaterial(repositories);

  return {
    listQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    searchQuestions,
    setQuestionChoice,
    applyQuestionChoicesToCandidatesForMaterial,
  };
};

export { createMaterialQuestionsService as materialQuestionsService };
