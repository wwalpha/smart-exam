import type { Kanji } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './createKanjiService';

export const createListKanji = (repositories: Repositories): KanjiService['listKanji'] => {
  return async (): Promise<Kanji[]> => {
    const items = await repositories.wordMaster.listKanji();
    return items.map((dbItem) => ({
      id: dbItem.wordId,
      kanji: dbItem.question,
      reading: dbItem.answer,
      subject: dbItem.subject,
    }));
  };
};
