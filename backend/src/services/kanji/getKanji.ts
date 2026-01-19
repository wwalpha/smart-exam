import { WordMasterService } from '@/services/WordMasterService';
import type { Kanji } from '@/services/repo.types';

export const getKanji = async (id: string): Promise<Kanji | null> => {
  const dbItem = await WordMasterService.get(id);
  if (!dbItem) return null;
  return {
    id: dbItem.wordId,
    kanji: dbItem.question,
    reading: dbItem.answer,
    subject: dbItem.subject,
  };
};
