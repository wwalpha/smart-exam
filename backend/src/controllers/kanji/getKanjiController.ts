import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';

import type { GetKanjiParams, GetKanjiResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const getKanjiController = (
  services: Services,
): AsyncHandler<GetKanjiParams, GetKanjiResponse | { error: string }, Record<string, never>, ParsedQs> => {
  return async (req, res) => {
    const { kanjiId } = req.params;
    const item = await services.kanji.getKanji(kanjiId);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };
};
