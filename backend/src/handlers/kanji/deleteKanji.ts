import { KanjiRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { DeleteKanjiParams, DeleteKanjiResponse } from '@smart-exam/api-types';

export const deleteKanji: AsyncHandler<DeleteKanjiParams, DeleteKanjiResponse | { error: string }, {}, ParsedQs> = async (
  req,
  res
) => {
  const { kanjiId } = req.params;
  const deleted = await KanjiRepository.deleteKanji(kanjiId);
  if (!deleted) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.status(204).send();
};
