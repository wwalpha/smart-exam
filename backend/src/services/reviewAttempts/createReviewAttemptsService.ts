// Module: createReviewAttemptsService responsibilities.

import type { Repositories } from '@/repositories/createRepositories';
import type { ReviewAttemptsService } from './createReviewAttemptsService.types';

import { createListReviewAttempts } from './listReviewAttempts';

export type { ReviewAttemptsService } from './createReviewAttemptsService.types';

/** Creates review attempts service. */
export const createReviewAttemptsService = (repositories: Repositories): ReviewAttemptsService => {
  // 処理で使う値を準備する
  const listReviewAttempts = createListReviewAttempts(repositories);

  // 処理結果を呼び出し元へ返す
  return { listReviewAttempts };
};
