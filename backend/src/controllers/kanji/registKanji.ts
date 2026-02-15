import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { RegistKanjiRequest, RegistKanjiResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const registKanji = (
  services: Services,
): AsyncHandler<ParamsDictionary, RegistKanjiResponse | { error: string }, RegistKanjiRequest, ParsedQs> => {
  return async (req, res) => {
    const body = req.validated?.body ?? req.body;
    const item = await services.kanji.registKanji(body as RegistKanjiRequest);
    res.status(201).json(item);
  };
};
