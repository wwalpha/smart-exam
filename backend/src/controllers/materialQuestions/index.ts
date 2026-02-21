import type { Services } from '@/services/createServices';

import { createQuestion } from './createQuestion';
import { deleteQuestion } from './deleteQuestion';
import { deleteQuestionReviewCandidate } from './deleteQuestionReviewCandidate';
import { listQuestions } from './listQuestions';
import { searchQuestions } from './searchQuestions';
import { updateQuestion } from './updateQuestion';
import { upsertQuestionReviewCandidate } from './upsertQuestionReviewCandidate';
import {
  CreateQuestionBodySchema,
  SearchQuestionsBodySchema,
  UpdateQuestionBodySchema,
} from './materialQuestions.schema';

export const materialQuestionsController = (services: Services) => {
  return {
    SearchQuestionsBodySchema,
    CreateQuestionBodySchema,
    UpdateQuestionBodySchema,
    searchQuestions: searchQuestions(services),
    listQuestions: listQuestions(services),
    createQuestion: createQuestion(services),
    updateQuestion: updateQuestion(services),
    deleteQuestion: deleteQuestion(services),
    upsertQuestionReviewCandidate: upsertQuestionReviewCandidate(services),
    deleteQuestionReviewCandidate: deleteQuestionReviewCandidate(services),
  };
};
