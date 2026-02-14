import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';

import type { UpdateKanjiParams, UpdateKanjiRequest, UpdateKanjiResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const updateKanjiController = (
  services: Services,
): AsyncHandler<UpdateKanjiParams, UpdateKanjiResponse | { error: string }, UpdateKanjiRequest, ParsedQs> => {
  return async (req, res) => {
    const { kanjiId } = req.params;
    const item = await services.kanji.updateKanji(kanjiId, req.body);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };
};
