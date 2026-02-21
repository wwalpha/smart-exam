import type { Kanji } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './kanji.types';

export const createGetKanji = (repositories: Repositories): KanjiService['getKanji'] => {
  return async (id: string): Promise<Kanji | null> => {
    const dbItem = await repositories.kanji.get(id);
    if (!dbItem) return null;

    return {
      id: dbItem.wordId,
      kanji: dbItem.question,
      reading: dbItem.answer,
      subject: dbItem.subject,
    };
  };
};
