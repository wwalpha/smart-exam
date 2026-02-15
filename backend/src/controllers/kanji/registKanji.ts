import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { CreateKanjiRequest, CreateKanjiResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const registKanji = (
  services: Services,
): AsyncHandler<ParamsDictionary, CreateKanjiResponse | { error: string }, CreateKanjiRequest, ParsedQs> => {
  return async (req, res) => {
    const body = req.validated?.body ?? req.body;
    const item = await services.kanji.createKanji(body as CreateKanjiRequest);
    res.status(201).json(item);
  };
};
