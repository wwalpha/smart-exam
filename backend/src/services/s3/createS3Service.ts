import type { GetUploadUrlRequest, GetUploadUrlResponse } from '@smart-exam/api-types';

import { ENV } from '@/lib/env';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';

export type S3Service = {
  getUploadUrl: (params: GetUploadUrlRequest) => Promise<GetUploadUrlResponse>;
};

export const createS3Service = (repositories: Repositories): S3Service => {
  const getUploadUrl: S3Service['getUploadUrl'] = async (params) => {
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

  return { getUploadUrl };
};
