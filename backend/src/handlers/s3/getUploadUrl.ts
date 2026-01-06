import { AwsUtils } from '@/lib/awsUtils';
import { ENV } from '@/lib/env';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { GetUploadUrlRequest, GetUploadUrlResponse } from '@smart-exam/api-types';
import { createUuid } from '@/lib/uuid';

const BUCKET_NAME = ENV.FILES_BUCKET_NAME;

export const getUploadUrl: AsyncHandler<ParamsDictionary, GetUploadUrlResponse, GetUploadUrlRequest, ParsedQs> = async (
  req,
  res
) => {
  const { fileName, contentType, prefix } = req.body;

  const normalizedPrefix = typeof prefix === 'string' ? prefix.replace(/^\/+/, '').replace(/\/+$/, '') : '';
  const base = normalizedPrefix ? normalizedPrefix : 'uploads';

  const key = `${base}/${createUuid()}-${fileName}`;
  const url = await AwsUtils.getPresignedPutUrl({ bucket: BUCKET_NAME, key, contentType, expiresInSeconds: 3600 });
  const result = { uploadUrl: url, fileKey: key };
  res.json(result);
};
