import type { GetUploadUrlResponse } from '@smart-exam/api-types';

import { ENV } from '@/lib/env';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';

import type { S3Service } from './createS3Service';

const getUploadUrlImpl = async (
  repositories: Repositories,
  params: Parameters<S3Service['getUploadUrl']>[0],
): Promise<GetUploadUrlResponse> => {
  const bucket = ENV.FILES_BUCKET_NAME;
  if (!bucket) {
    return { uploadUrl: '', fileKey: '' };
  }

  const normalizedPrefix =
    typeof params.prefix === 'string' ? params.prefix.replace(/^\/+/, '').replace(/\/+$/, '') : '';
  const base = normalizedPrefix ? normalizedPrefix : 'uploads';

  const key = `${base}/${createUuid()}-${params.fileName}`;
  const url = await repositories.s3.getPresignedPutUrl({
    bucket,
    key,
    contentType: params.contentType,
    expiresInSeconds: 3600,
  });

  return { uploadUrl: url, fileKey: key };
};

export const createGetUploadUrl = (repositories: Repositories): S3Service['getUploadUrl'] => {
  return getUploadUrlImpl.bind(null, repositories);
};
