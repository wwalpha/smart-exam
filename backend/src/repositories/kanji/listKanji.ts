import { WordMasterService } from '@/services/WordMasterService';
import type { Kanji } from '@/repositories/repo.types';

export const listKanji = async (): Promise<Kanji[]> => {
  const items = await WordMasterService.listKanji();

  return items.map((dbItem) => ({
    id: dbItem.wordId,
    kanji: dbItem.question,
    reading: dbItem.answer,
    subject: dbItem.subject,
  }));
};
