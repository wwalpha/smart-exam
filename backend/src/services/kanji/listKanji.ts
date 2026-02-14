import type { Kanji } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './createKanjiService';

// 公開するサービス処理を定義する
export const createListKanji = (repositories: Repositories): KanjiService['listKanji'] => {
  // 処理結果を呼び出し元へ返す
  return async (): Promise<Kanji[]> => {
    // 非同期で必要な値を取得する
    const items = await repositories.wordMaster.listKanji();
    // 処理結果を呼び出し元へ返す
    return items.map((dbItem) => ({
      id: dbItem.wordId,
      kanji: dbItem.question,
      reading: dbItem.answer,
      subject: dbItem.subject,
    }));
  };
};
