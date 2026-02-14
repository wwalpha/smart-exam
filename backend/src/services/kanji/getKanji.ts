import type { Kanji } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './createKanjiService';

// 公開するサービス処理を定義する
export const createGetKanji = (repositories: Repositories): KanjiService['getKanji'] => {
  // 処理結果を呼び出し元へ返す
  return async (id): Promise<Kanji | null> => {
    // 非同期で必要な値を取得する
    const dbItem = await repositories.wordMaster.get(id);
    // 条件に応じて処理を分岐する
    if (!dbItem) return null;

    // 処理結果を呼び出し元へ返す
    return {
      id: dbItem.wordId,
      kanji: dbItem.question,
      reading: dbItem.answer,
      subject: dbItem.subject,
    };
  };
};
