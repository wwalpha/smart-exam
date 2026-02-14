// Module: getUploadUrlController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { GetUploadUrlRequest, GetUploadUrlResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { GetUploadUrlBodySchema } from './getUploadUrlController.schema';

/** Creates get upload url controller. */
export const getUploadUrlController = (services: Services) => {
  const getUploadUrl: AsyncHandler<ParamsDictionary, GetUploadUrlResponse, GetUploadUrlRequest, ParsedQs> = async (
    req,
    res,
  ) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof GetUploadUrlBodySchema>;
    const result = await services.s3.getUploadUrl(body);
    res.json(result);
  };

  return { GetUploadUrlBodySchema, getUploadUrl };
};
