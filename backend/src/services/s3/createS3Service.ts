import type { Repositories } from '@/repositories/createRepositories';
import type { S3Service } from './createS3Service.types';

import { createGetUploadUrl } from './getUploadUrl';

export type { S3Service } from './createS3Service.types';

// 公開するサービス処理を定義する
export const createS3Service = (repositories: Repositories): S3Service => {
  // 処理で使う値を準備する
  const getUploadUrl = createGetUploadUrl(repositories);

  // 処理結果を呼び出し元へ返す
  return { getUploadUrl };
};
