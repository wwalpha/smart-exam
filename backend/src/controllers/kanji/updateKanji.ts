import { KanjiRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { UpdateKanjiParams, UpdateKanjiRequest, UpdateKanjiResponse } from '@smart-exam/api-types';

export const updateKanji: AsyncHandler<
  UpdateKanjiParams,
  UpdateKanjiResponse | { error: string },
  UpdateKanjiRequest,
  ParsedQs
> = async (req, res) => {
  const { kanjiId } = req.params;
  const item = await KanjiRepository.updateKanji(kanjiId, req.body);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};
