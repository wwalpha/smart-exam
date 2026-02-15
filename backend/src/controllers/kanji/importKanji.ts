import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { ImportKanjiRequest, ImportKanjiResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const importKanji = (
  services: Services,
): AsyncHandler<ParamsDictionary, ImportKanjiResponse, ImportKanjiRequest, ParsedQs> => {
  return async (req, res) => {
    const body = req.validated?.body ?? req.body;
    const result = await services.kanji.importKanji(body as ImportKanjiRequest);
    res.json(result);
  };
};
