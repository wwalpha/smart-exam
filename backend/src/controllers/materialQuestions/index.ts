import type { Services } from '@/services/createServices';

import { createQuestion } from './createQuestion';
import { deleteQuestion } from './deleteQuestion';
import { listQuestions } from './listQuestions';
import { searchQuestions } from './searchQuestions';
import { setMaterialChoices } from './setMaterialChoices';
import { updateQuestion } from './updateQuestion';
import {
  CreateQuestionBodySchema,
  SearchQuestionsBodySchema,
  SetMaterialChoicesBodySchema,
  UpdateQuestionBodySchema,
} from './materialQuestions.schema';

export const materialQuestionsController = (services: Services) => {
  return {
    SearchQuestionsBodySchema,
    CreateQuestionBodySchema,
    UpdateQuestionBodySchema,
    SetMaterialChoicesBodySchema,
    searchQuestions: searchQuestions(services),
    listQuestions: listQuestions(services),
    createQuestion: createQuestion(services),
    updateQuestion: updateQuestion(services),
    deleteQuestion: deleteQuestion(services),
    setMaterialChoices: setMaterialChoices(services),
  };
};
