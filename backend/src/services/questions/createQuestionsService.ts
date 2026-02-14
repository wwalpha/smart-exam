// Module: createQuestionsService responsibilities.

import type {
  CreateQuestionRequest,
  Question,
  QuestionListResponse,
  QuestionSearchResult,
  SearchQuestionsRequest,
} from '@smart-exam/api-types';
import type { Repositories } from '@/repositories/createRepositories';

import { createCreateQuestion } from './createQuestion';
import { createDeleteQuestion } from './deleteQuestion';
import { createListQuestions } from './listQuestions';
import { createMarkQuestionCorrect } from './markQuestionCorrect';
import { createMarkQuestionIncorrect } from './markQuestionIncorrect';
import { createRecalculateCandidatesForMaterial } from './recalculateCandidatesForMaterial';
import { createSearchQuestions } from './searchQuestions';
import { createUpdateQuestion } from './updateQuestion';

/** Type definition for QuestionsService. */
export type QuestionsService = {
  listQuestions: (materialId: string) => Promise<QuestionListResponse['datas']>;
  createQuestion: (data: CreateQuestionRequest & { materialId: string }) => Promise<Question>;
  updateQuestion: (questionId: string, updates: Partial<CreateQuestionRequest>) => Promise<Question | null>;
  deleteQuestion: (questionId: string) => Promise<boolean>;
  searchQuestions: (params: SearchQuestionsRequest) => Promise<QuestionSearchResult[]>;
  markQuestionCorrect: (questionId: string) => Promise<boolean>;
  markQuestionIncorrect: (questionId: string) => Promise<boolean>;
  recalculateCandidatesForMaterial: (params: { materialId: string; registeredDate: string }) => Promise<void>;
};

/** Creates questions service. */
export const createQuestionsService = (repositories: Repositories): QuestionsService => {
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
