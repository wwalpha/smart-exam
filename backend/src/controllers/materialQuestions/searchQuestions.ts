import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParsedQs } from 'qs';
import type { ParamsDictionary } from 'express-serve-static-core';

import type { SearchQuestionsRequest, SearchQuestionsResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { SearchQuestionsBodySchema } from './materialQuestions.schema';

export const searchQuestions = (
  services: Services,
): AsyncHandler<ParamsDictionary, SearchQuestionsResponse, SearchQuestionsRequest, ParsedQs> => {
  return async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchQuestionsBodySchema>;
    const items = await services.materialQuestions.searchQuestions({ keyword: body.keyword, subject: body.subject });
    res.json({ datas: items });
  };
};
