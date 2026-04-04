import type { Services } from '@/services/createServices';

import { createQuestionsBulk } from './createQuestionsBulk';
import { createQuestion } from './createQuestion';
import { deleteQuestion } from './deleteQuestion';
import { listQuestions } from './listQuestions';
import { setMaterialChoices } from './setMaterialChoices';
import { updateQuestion } from './updateQuestion';
import {
  CreateQuestionsBulkBodySchema,
  CreateQuestionBodySchema,
  SetMaterialChoicesBodySchema,
  UpdateQuestionBodySchema,
} from './materialQuestions.schema';

export const materialQuestionsController = (services: Services) => {
  return {
    CreateQuestionsBulkBodySchema,
    CreateQuestionBodySchema,
    UpdateQuestionBodySchema,
    SetMaterialChoicesBodySchema,
    listQuestions: listQuestions(services),
    createQuestion: createQuestion(services),
    createQuestionsBulk: createQuestionsBulk(services),
    updateQuestion: updateQuestion(services),
    deleteQuestion: deleteQuestion(services),
    setMaterialChoices: setMaterialChoices(services),
  };
};
