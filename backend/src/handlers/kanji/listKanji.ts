import { KanjiRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { KanjiListResponse } from '@smart-exam/api-types';

export const listKanji: AsyncHandler<ParamsDictionary, KanjiListResponse, {}, ParsedQs> = async (_req, res) => {
  const items = await KanjiRepository.listKanji();
  res.json({ items, total: items.length });
};
