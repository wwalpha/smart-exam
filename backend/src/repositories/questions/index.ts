import { createQuestion } from './createQuestion';
import { deleteQuestion } from './deleteQuestion';
import { listQuestions } from './listQuestions';
import { markQuestionCorrect, markQuestionIncorrect } from './markQuestionResult';
import { searchQuestions } from './searchQuestions';
import { updateQuestion } from './updateQuestion';

export { createQuestion, deleteQuestion, listQuestions, markQuestionCorrect, markQuestionIncorrect, searchQuestions, updateQuestion };

export const QuestionRepository = {
  createQuestion,
  listQuestions,
  markQuestionCorrect,
  markQuestionIncorrect,
  updateQuestion,
  deleteQuestion,
  searchQuestions,
};
