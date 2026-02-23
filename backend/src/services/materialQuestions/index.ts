import type { Repositories } from '@/repositories/createRepositories';

import { createApplyChoices } from './applyChoices';
import { createCreateQuestion } from './createQuestion';
import { createDeleteQuestion } from './deleteQuestion';
import { createListQuestions } from './listQuestions';
import { createSearchQuestions } from './searchQuestions';
import { createSetMaterialChoices } from './setMaterialChoices';
import { createUpdateQuestion } from './updateQuestion';
import type { MaterialQuestionsService } from './materialQuestions.types';

export type { MaterialQuestionsService } from './materialQuestions.types';

export const createMaterialQuestionsService = (repositories: Repositories): MaterialQuestionsService => {
  // 各ユースケースをリポジトリ依存込みで組み立てる。
  const listQuestions = createListQuestions(repositories);
  const createQuestion = createCreateQuestion(repositories);
  const updateQuestion = createUpdateQuestion(repositories);
  const deleteQuestion = createDeleteQuestion(repositories);
  const searchQuestions = createSearchQuestions(repositories);
  const setMaterialChoices = createSetMaterialChoices(repositories);
  const applyChoices = createApplyChoices(repositories);

  // サービスの公開APIを返す。
  return {
    listQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    searchQuestions,
    setMaterialChoices,
    applyChoices,
  };
};

export { createMaterialQuestionsService as materialQuestionsService };
