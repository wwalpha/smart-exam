import type { SearchKanjiResponse } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './createKanjiService';

export const createSearchKanji = (repositories: Repositories): KanjiService['searchKanji'] => {
  return async (params): Promise<SearchKanjiResponse> => {
    const items = await repositories.wordMaster.listKanji();

    const qLower = (params.q ?? '').trim().toLowerCase();
    const readingLower = (params.reading ?? '').trim().toLowerCase();
    const subjectLower = (params.subject ?? '').trim().toLowerCase();

    const filtered = items
      .map((dbItem) => ({
        id: dbItem.wordId,
        kanji: dbItem.question,
        reading: dbItem.answer,
        subject: dbItem.subject,
      }))
      .filter((x) => {
        if (
          qLower &&
          !String(x.kanji ?? '')
            .toLowerCase()
            .includes(qLower)
        )
          return false;
        if (
          readingLower &&
          !String(x.reading ?? '')
            .toLowerCase()
            .includes(readingLower)
        )
          return false;
        if (subjectLower && String(x.subject ?? '').toLowerCase() !== subjectLower) return false;
        return true;
      });

    return { items: filtered, total: filtered.length };
  };
};
