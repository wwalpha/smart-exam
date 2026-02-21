import type { Services } from '@/services/createServices';

import { createQuestion } from './createQuestion';
import { deleteQuestion } from './deleteQuestion';
import { listQuestions } from './listQuestions';
import { searchQuestions } from './searchQuestions';
import { setQuestionChoice } from './setQuestionChoice';
import { updateQuestion } from './updateQuestion';
import {
  CreateQuestionBodySchema,
  SearchQuestionsBodySchema,
  SetQuestionChoiceBodySchema,
  UpdateQuestionBodySchema,
} from './materialQuestions.schema';

export const materialQuestionsController = (services: Services) => {
  return {
    SearchQuestionsBodySchema,
    CreateQuestionBodySchema,
    UpdateQuestionBodySchema,
    SetQuestionChoiceBodySchema,
    searchQuestions: searchQuestions(services),
    listQuestions: listQuestions(services),
    createQuestion: createQuestion(services),
    updateQuestion: updateQuestion(services),
    deleteQuestion: deleteQuestion(services),
    setQuestionChoice: setQuestionChoice(services),
  };
};
