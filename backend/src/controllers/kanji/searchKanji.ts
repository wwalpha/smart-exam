import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { SearchKanjiRequest, SearchKanjiResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const searchKanji = (
  services: Services,
): AsyncHandler<ParamsDictionary, SearchKanjiResponse, SearchKanjiRequest, ParsedQs> => {
  return async (req, res) => {
    const body = req.validated?.body ?? req.body;
    const result = await services.kanji.searchKanji(body as SearchKanjiRequest);
    res.json(result);
  };
};
