import type {} from '@smart-exam/api-types';
import type { Repositories } from '@/repositories/createRepositories';
import type { KanjiService } from './createKanjiService.types';

import { createCreateKanji } from './createKanji';
import { createDeleteKanji } from './deleteKanji';
import { createDeleteManyKanji } from './deleteManyKanji';
import { createGetKanji } from './getKanji';
import { createImportKanji } from './importKanji';
import { createListKanji } from './listKanji';
import { createSearchKanji } from './searchKanji';
import { createUpdateKanji } from './updateKanji';

export type { KanjiService } from './createKanjiService.types';

// 公開するサービス処理を定義する
export const createKanjiService = (repositories: Repositories): KanjiService => {
  // 処理で使う値を準備する
  const listKanji = createListKanji(repositories);
  // 処理で使う値を準備する
  const searchKanji = createSearchKanji(repositories);
  // 処理で使う値を準備する
  const createKanji = createCreateKanji(repositories);
  // 処理で使う値を準備する
  const getKanji = createGetKanji(repositories);
  // 処理で使う値を準備する
  const updateKanji = createUpdateKanji(repositories);
  // 処理で使う値を準備する
  const deleteKanji = createDeleteKanji(repositories);
  // 処理で使う値を準備する
  const deleteManyKanji = createDeleteManyKanji(repositories);
  // 処理で使う値を準備する
  const importKanji = createImportKanji(repositories);

  // 処理結果を呼び出し元へ返す
  return {
    listKanji,
    searchKanji,
    createKanji,
    getKanji,
    updateKanji,
    deleteKanji,
    deleteManyKanji,
    importKanji,
  };
};
