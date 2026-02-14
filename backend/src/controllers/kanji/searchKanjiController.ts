import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { SearchKanjiRequest, SearchKanjiResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { SearchKanjiBodySchema } from './kanjiController.schema';

export const searchKanjiController = (
  services: Services,
): AsyncHandler<ParamsDictionary, SearchKanjiResponse, SearchKanjiRequest, ParsedQs> => {
  return async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchKanjiBodySchema>;
    const result = await services.kanji.searchKanji(body);
    res.json(result);
  };
};
