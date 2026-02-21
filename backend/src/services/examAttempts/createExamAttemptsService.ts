// Module: createExamAttemptsService responsibilities.

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamAttemptsService } from './createExamAttemptsService.types';

import { createListExamAttempts } from './listExamAttempts';

export type { ExamAttemptsService } from './createExamAttemptsService.types';

/** Creates exam attempts service. */
export const createExamAttemptsService = (repositories: Repositories): ExamAttemptsService => {
  // 処理で使う値を準備する
  const listExamAttempts = createListExamAttempts(repositories);

  // 処理結果を呼び出し元へ返す
  return { listExamAttempts };
};
