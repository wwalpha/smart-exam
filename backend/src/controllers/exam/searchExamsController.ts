// Module: searchExamsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { SearchReviewTestsRequest, SearchReviewTestsResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { SearchReviewTestsBodySchema } from './searchExamsController.schema';

/** Creates search review tests controller. */
export const searchExamsController = (services: Services) => {
  const searchExams: AsyncHandler<
    ParamsDictionary,
    SearchReviewTestsResponse,
    SearchReviewTestsRequest,
    ParsedQs
  > = async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchReviewTestsBodySchema>;
    const result = await services.reviewTests.searchExams(body);
    res.json(result);
  };

  return { SearchReviewTestsBodySchema, searchExams };
};
