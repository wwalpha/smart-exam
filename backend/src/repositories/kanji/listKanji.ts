import { WordsService } from '@/services/WordsService';
import type { Kanji } from '@/repositories/repo.types';

export const listKanji = async (): Promise<Kanji[]> => {
  const items = await WordsService.listKanji();

  return items.map((dbItem) => ({
    id: dbItem.wordId,
    kanji: dbItem.question,
    reading: dbItem.answer,
    subject: dbItem.subject,
  }));
};
