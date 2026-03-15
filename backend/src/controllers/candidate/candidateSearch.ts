import type { CandidateSearchRequest, CandidateSearchResponse } from '@smart-exam/api-types';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { Services } from '@/services/createServices';

import { CandidateSearchBodySchema } from './candidate.schema';

export const candidateSearch = (
  services: Services,
): AsyncHandler<ParamsDictionary, CandidateSearchResponse, CandidateSearchRequest, ParsedQs> => {
  return async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CandidateSearchBodySchema>;
    const items = await services.candidates.candidateSearch({ subject: body.subject, mode: body.mode, nextTime: body.nextTime });
    res.json({ datas: items });
  };
};