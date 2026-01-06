import { KanjiRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { ImportKanjiRequest, ImportKanjiResponse } from '@smart-exam/api-types';

export const importKanji: AsyncHandler<ParamsDictionary, ImportKanjiResponse, ImportKanjiRequest, ParsedQs> = async (
  req,
  res
) => {
  const result = await KanjiRepository.importKanji(req.body);
  res.json(result);
};
