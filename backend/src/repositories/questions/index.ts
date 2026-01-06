import { createQuestion } from './createQuestion';
import { deleteQuestion } from './deleteQuestion';
import { listQuestions } from './listQuestions';
import { searchQuestions } from './searchQuestions';
import { updateQuestion } from './updateQuestion';

export { createQuestion, deleteQuestion, listQuestions, searchQuestions, updateQuestion };

export const QuestionRepository = {
  createQuestion,
  listQuestions,
  updateQuestion,
  deleteQuestion,
  searchQuestions,
};
