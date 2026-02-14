import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { CreateKanjiRequest, CreateKanjiResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { CreateKanjiBodySchema } from './kanjiController.schema';

export const createKanjiController = (
  services: Services,
): AsyncHandler<ParamsDictionary, CreateKanjiResponse | { error: string }, CreateKanjiRequest, ParsedQs> => {
  return async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateKanjiBodySchema>;
    const item = await services.kanji.createKanji(body);
    res.status(201).json(item);
  };
};
