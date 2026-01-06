import { WordsService } from '@/services/WordsService';
import type { WordMasterTable } from '@/types/db';
import type { CreateKanjiRequest, Kanji } from '@/repositories/repo.types';
import { createUuid } from '@/lib/uuid';

export const createKanji = async (data: CreateKanjiRequest): Promise<Kanji> => {
  const id = createUuid();

  const item: Kanji = { id, ...data };

  const dbItem: WordMasterTable = {
    wordId: id,
    question: data.kanji,
    answer: data.reading || '',
    subject: data.subject,
  };

  await WordsService.create(dbItem);

  return item;
};
