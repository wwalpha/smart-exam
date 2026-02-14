import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { ImportKanjiRequest, ImportKanjiResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { ImportKanjiBodySchema } from './kanjiController.schema';

export const importKanjiController = (
  services: Services,
): AsyncHandler<ParamsDictionary, ImportKanjiResponse, ImportKanjiRequest, ParsedQs> => {
  return async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof ImportKanjiBodySchema>;
    const result = await services.kanji.importKanji(body);
    res.json(result);
  };
};
