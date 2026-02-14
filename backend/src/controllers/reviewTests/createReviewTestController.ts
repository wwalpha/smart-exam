// Module: createReviewTestController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { CreateReviewTestRequest, CreateReviewTestResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { CreateReviewTestBodySchema } from './createReviewTestController.schema';

/** Creates create review test controller. */
export const createReviewTestController = (services: Services) => {
  const createReviewTest: AsyncHandler<
    ParamsDictionary,
    CreateReviewTestResponse,
    CreateReviewTestRequest,
    ParsedQs
  > = async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateReviewTestBodySchema>;
    const item = await services.reviewTests.createReviewTest(body);
    res.status(201).json(item);
  };

  return { CreateReviewTestBodySchema, createReviewTest };
};
