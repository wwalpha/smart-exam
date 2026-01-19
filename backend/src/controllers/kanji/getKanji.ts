import { KanjiRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { GetKanjiParams, GetKanjiResponse } from '@smart-exam/api-types';

export const getKanji: AsyncHandler<GetKanjiParams, GetKanjiResponse | { error: string }, {}, ParsedQs> = async (
  req,
  res
) => {
  const { kanjiId } = req.params;
  const item = await KanjiRepository.getKanji(kanjiId);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};
