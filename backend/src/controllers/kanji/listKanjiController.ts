import type { AsyncHandler } from '@/lib/handler';
import type { Services } from '@/services/createServices';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { KanjiListResponse } from '@smart-exam/api-types';

export const listKanjiController = (
  services: Services,
): AsyncHandler<ParamsDictionary, KanjiListResponse, Record<string, never>, ParsedQs> => {
  return async (_req, res) => {
    const items = await services.kanji.listKanji();
    res.json({ items, total: items.length });
  };
};
