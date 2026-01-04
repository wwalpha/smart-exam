import { WordsService } from '../services/WordsService';
import { WordTable } from '../types/db';
import { Kanji, CreateKanjiRequest } from './repo.types';
import { randomUUID } from 'crypto';
import { DateUtils } from '@/lib/dateUtils';

export const KanjiRepository = {
  createKanji: async (data: CreateKanjiRequest): Promise<Kanji> => {
    const now = DateUtils.now();
    const id = randomUUID();
    
    const item: Kanji = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const dbItem: WordTable = {
      wordId: id,
      question: data.kanji,
      answer: data.reading || '',
      answerHiragana: data.reading || '',
      wordType: 'KANJI',
    };

    await WordsService.create(dbItem);

    return item;
  },

  listKanji: async (): Promise<Kanji[]> => {
    const items = await WordsService.listKanji();
    
    return items.map(dbItem => ({
      id: dbItem.wordId,
      kanji: dbItem.question,
      reading: dbItem.answer,
      createdAt: DateUtils.now(), // TODO: Should use stored date if available
      updatedAt: DateUtils.now(),
    }));
  }
};
