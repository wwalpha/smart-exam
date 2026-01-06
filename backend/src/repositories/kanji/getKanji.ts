import { WordsService } from '@/services/WordsService';
import type { Kanji } from '@/repositories/repo.types';

export const getKanji = async (id: string): Promise<Kanji | null> => {
  const dbItem = await WordsService.get(id);
  if (!dbItem) return null;
  return {
    id: dbItem.wordId,
    kanji: dbItem.question,
    reading: dbItem.answer,
    subject: dbItem.subject,
  };
};
