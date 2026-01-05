import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { ApiError } from '@/lib/apiError';

export const getMaterialFile: AsyncHandler<ParamsDictionary, unknown, {}, ParsedQs> = async (req, res) => {
  const key = typeof req.query.key === 'string' ? req.query.key : '';
  if (!key) {
    throw new ApiError('key is required', 400, ['invalid_request']);
  }

  // 任意のS3オブジェクトを読めないように制限する
  if (!key.startsWith('materials/')) {
    throw new ApiError('invalid key', 400, ['invalid_request']);
  }

  const file = await MaterialRepository.getMaterialFileByKey(key);
  if (!file) {
    throw new ApiError('not found', 404, ['not_found']);
  }

  res.status(200);
  res.setHeader('content-type', file.contentType);
  res.setHeader('content-disposition', `inline; filename="${file.filename}"`);
  res.send(file.body);
};
