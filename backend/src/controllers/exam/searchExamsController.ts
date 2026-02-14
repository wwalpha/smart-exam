// Module: searchExamsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { SearchExamsRequest, SearchExamsResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { SearchExamsBodySchema } from './searchExamsController.schema';

/** Creates search review tests controller. */
export const searchExamsController = (services: Services) => {
  const searchExams: AsyncHandler<
    ParamsDictionary,
    SearchExamsResponse,
    SearchExamsRequest,
    ParsedQs
  > = async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchExamsBodySchema>;
    const result = await services.exams.searchExams(body);
    res.json(result);
  };

  return { SearchExamsBodySchema, searchExams };
};
