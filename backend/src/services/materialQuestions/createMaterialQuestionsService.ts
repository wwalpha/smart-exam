// Module: createMaterialQuestionsService responsibilities.

import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialQuestionsService } from './materialQuestionsService.types';

import { createCreateQuestion } from './createQuestion';
import { createDeleteQuestion } from './deleteQuestion';
import { createListQuestions } from './listQuestions';
import { createMarkQuestionCorrect } from './markQuestionCorrect';
import { createMarkQuestionIncorrect } from './markQuestionIncorrect';
import { createRecalculateCandidatesForMaterial } from './recalculateCandidatesForMaterial';
import { createSearchQuestions } from './searchQuestions';
import { createUpdateQuestion } from './updateQuestion';

export type { MaterialQuestionsService } from './materialQuestionsService.types';

/** Creates questions service. */
export const createMaterialQuestionsService = (repositories: Repositories): MaterialQuestionsService => {
  // 処理で使う値を準備する
  const listQuestions = createListQuestions(repositories);
  // 処理で使う値を準備する
  const createQuestion = createCreateQuestion(repositories);
  // 処理で使う値を準備する
  const updateQuestion = createUpdateQuestion(repositories);
  // 処理で使う値を準備する
  const deleteQuestion = createDeleteQuestion(repositories);
  // 処理で使う値を準備する
  const searchQuestions = createSearchQuestions(repositories);
  // 処理で使う値を準備する
  const markQuestionCorrect = createMarkQuestionCorrect(repositories);
  // 処理で使う値を準備する
  const markQuestionIncorrect = createMarkQuestionIncorrect(repositories);
  // 処理で使う値を準備する
  const recalculateCandidatesForMaterial = createRecalculateCandidatesForMaterial(repositories);

  // 処理結果を呼び出し元へ返す
  return {
    listQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    searchQuestions,
    markQuestionCorrect,
    markQuestionIncorrect,
    recalculateCandidatesForMaterial,
  };
};
