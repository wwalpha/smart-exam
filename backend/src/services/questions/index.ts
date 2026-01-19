import { createQuestion } from './createQuestion';
import { deleteQuestion } from './deleteQuestion';
import { listQuestions } from './listQuestions';
import { markQuestionCorrect, markQuestionIncorrect } from './markQuestionResult';
import { recalculateCandidatesForMaterial } from './recalculateCandidatesForMaterial';
import { searchQuestions } from './searchQuestions';
import { updateQuestion } from './updateQuestion';

export {
  createQuestion,
  deleteQuestion,
  listQuestions,
  markQuestionCorrect,
  markQuestionIncorrect,
  recalculateCandidatesForMaterial,
  searchQuestions,
  updateQuestion,
};

export const QuestionRepository = {
  createQuestion,
  listQuestions,
  markQuestionCorrect,
  markQuestionIncorrect,
  recalculateCandidatesForMaterial,
  updateQuestion,
  deleteQuestion,
  searchQuestions,
};
