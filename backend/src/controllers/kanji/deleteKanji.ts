import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';

import type { DeleteKanjiParams, DeleteKanjiResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const deleteKanji = (
  services: Services,
): AsyncHandler<DeleteKanjiParams, DeleteKanjiResponse | { error: string }, Record<string, never>, ParsedQs> => {
  return async (req, res) => {
    const { kanjiId } = req.params;
    const deleted = await services.kanji.deleteKanji(kanjiId);
    if (!deleted) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.status(204).send();
  };
};
