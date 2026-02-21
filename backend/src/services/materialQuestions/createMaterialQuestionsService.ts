// Module: createMaterialQuestionsService responsibilities.

import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialQuestionsService } from './materialQuestionsService.types';

import { createCreateQuestion } from './createQuestion';
import { createDeleteQuestion } from './deleteQuestion';
import { createListQuestions } from './listQuestions';
import { createSetQuestionChoice } from './setQuestionChoice';
import { createRecalculateCandidatesForMaterial } from './recalculateCandidatesForMaterial';
import { createApplyQuestionChoicesToCandidatesForMaterial } from './applyQuestionChoicesToCandidatesForMaterial';
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
  const setQuestionChoice = createSetQuestionChoice(repositories);
  // 処理で使う値を準備する
  const recalculateCandidatesForMaterial = createRecalculateCandidatesForMaterial(repositories);
  // 処理で使う値を準備する
  const applyQuestionChoicesToCandidatesForMaterial = createApplyQuestionChoicesToCandidatesForMaterial(repositories);

  // 処理結果を呼び出し元へ返す
  return {
    listQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    searchQuestions,
    setQuestionChoice,
    recalculateCandidatesForMaterial,
    applyQuestionChoicesToCandidatesForMaterial,
  };
};
