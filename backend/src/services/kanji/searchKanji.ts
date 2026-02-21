import type { SearchKanjiResponse } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './kanji.types';

// 公開する処理を定義する
export const createSearchKanji = (repositories: Repositories): KanjiService['searchKanji'] => {
  // 処理結果を呼び出し元へ返す
  return async (params: Parameters<KanjiService['searchKanji']>[0]): Promise<SearchKanjiResponse> => {
    // 内部で利用する処理を定義する
    const items = await repositories.kanji.listKanji();

    // 内部で利用する処理を定義する
    const qLower = (params.q ?? '').trim().toLowerCase();
    // 内部で利用する処理を定義する
    const readingLower = (params.reading ?? '').trim().toLowerCase();
    // 内部で利用する処理を定義する
    const subjectLower = (params.subject ?? '').trim().toLowerCase();

    // 内部で利用する処理を定義する
    const filtered = items
      .map((dbItem) => ({
        id: dbItem.wordId,
        kanji: dbItem.question,
        reading: dbItem.answer,
        subject: dbItem.subject,
      }))
      .filter((x) => {
        // 条件に応じて処理を分岐する
        if (
          qLower &&
          !String(x.kanji ?? '')
            .toLowerCase()
            .includes(qLower)
        )
          // 処理結果を呼び出し元へ返す
          return false;
        // 条件に応じて処理を分岐する
        if (
          readingLower &&
          !String(x.reading ?? '')
            .toLowerCase()
            .includes(readingLower)
        )
          // 処理結果を呼び出し元へ返す
          return false;
        // 条件に応じて処理を分岐する
        if (subjectLower && String(x.subject ?? '').toLowerCase() !== subjectLower) return false;
        // 処理結果を呼び出し元へ返す
        return true;
      });

    // 処理結果を呼び出し元へ返す
    return { items: filtered, total: filtered.length };
  };
};
