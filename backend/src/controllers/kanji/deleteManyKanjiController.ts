import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { DeleteManyKanjiRequest, DeleteManyKanjiResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { DeleteManyKanjiBodySchema } from './kanjiController.schema';

export const deleteManyKanjiController = (
  services: Services,
): AsyncHandler<ParamsDictionary, DeleteManyKanjiResponse | { error: string }, DeleteManyKanjiRequest, ParsedQs> => {
  return async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof DeleteManyKanjiBodySchema>;
    await services.kanji.deleteManyKanji(body.kanjiIds);
    res.status(204).send();
  };
};
