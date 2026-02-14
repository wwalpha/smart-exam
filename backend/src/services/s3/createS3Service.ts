import type { GetUploadUrlRequest, GetUploadUrlResponse } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import { createGetUploadUrl } from './getUploadUrl';

export type S3Service = {
  getUploadUrl: (params: GetUploadUrlRequest) => Promise<GetUploadUrlResponse>;
};

export const createS3Service = (repositories: Repositories): S3Service => {
  const getUploadUrl = createGetUploadUrl(repositories);

  return { getUploadUrl };
};
