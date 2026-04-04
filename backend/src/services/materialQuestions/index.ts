import type { Repositories } from '@/repositories/createRepositories';

import { createApplyChoices } from './applyChoices';
import { createCreateQuestion } from './createQuestion';
import { createCreateQuestionsBulk } from './createQuestionsBulk';
import { createDeleteQuestion } from './deleteQuestion';
import { createListQuestions } from './listQuestions';
import { createSetMaterialChoices } from './setMaterialChoices';
import { createUpdateQuestion } from './updateQuestion';
import type { MaterialQuestionsService } from './materialQuestions.types';

export type { MaterialQuestionsService } from './materialQuestions.types';

export const createMaterialQuestionsService = (repositories: Repositories): MaterialQuestionsService => {
  // 各ユースケースをリポジトリ依存込みで組み立てる。
  const listQuestions = createListQuestions(repositories);
  const createQuestion = createCreateQuestion(repositories);
  const createQuestionsBulk = createCreateQuestionsBulk(repositories);
  const updateQuestion = createUpdateQuestion(repositories);
  const deleteQuestion = createDeleteQuestion(repositories);
  const setMaterialChoices = createSetMaterialChoices(repositories);
  const applyChoices = createApplyChoices(repositories);

  // サービスの公開APIを返す。
  return {
    listQuestions,
    createQuestion,
    createQuestionsBulk,
    updateQuestion,
    deleteQuestion,
    setMaterialChoices,
    applyChoices,
  };
};

export { createMaterialQuestionsService as materialQuestionsService };
