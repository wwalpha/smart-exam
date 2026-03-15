import type { Services } from '@/services/createServices';

import { createQuestion } from './createQuestion';
import { deleteQuestion } from './deleteQuestion';
import { listQuestions } from './listQuestions';
import { setMaterialChoices } from './setMaterialChoices';
import { updateQuestion } from './updateQuestion';
import {
  CreateQuestionBodySchema,
  SetMaterialChoicesBodySchema,
  UpdateQuestionBodySchema,
} from './materialQuestions.schema';

export const materialQuestionsController = (services: Services) => {
  return {
    CreateQuestionBodySchema,
    UpdateQuestionBodySchema,
    SetMaterialChoicesBodySchema,
    listQuestions: listQuestions(services),
    createQuestion: createQuestion(services),
    updateQuestion: updateQuestion(services),
    deleteQuestion: deleteQuestion(services),
    setMaterialChoices: setMaterialChoices(services),
  };
};
