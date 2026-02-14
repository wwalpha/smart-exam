import type { Kanji } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './createKanjiService';

export const createGetKanji = (repositories: Repositories): KanjiService['getKanji'] => {
  return async (id): Promise<Kanji | null> => {
    const dbItem = await repositories.wordMaster.get(id);
    if (!dbItem) return null;

    return {
      id: dbItem.wordId,
      kanji: dbItem.question,
      reading: dbItem.answer,
      subject: dbItem.subject,
    };
  };
};
