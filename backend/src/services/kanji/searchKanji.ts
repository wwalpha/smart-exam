import type { SearchKanjiResponse } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './createKanjiService';

// 公開するサービス処理を定義する
export const createSearchKanji = (repositories: Repositories): KanjiService['searchKanji'] => {
  // 処理結果を呼び出し元へ返す
  return async (params): Promise<SearchKanjiResponse> => {
    // 非同期で必要な値を取得する
    const items = await repositories.wordMaster.listKanji();

    // 処理で使う値を準備する
    const qLower = (params.q ?? '').trim().toLowerCase();
    // 処理で使う値を準備する
    const readingLower = (params.reading ?? '').trim().toLowerCase();
    // 処理で使う値を準備する
    const subjectLower = (params.subject ?? '').trim().toLowerCase();

    // 処理で使う値を準備する
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
