import type {
  CreateKanjiRequest,
  ImportKanjiRequest,
  ImportKanjiResponse,
  Kanji,
  SearchKanjiRequest,
  SearchKanjiResponse,
  UpdateKanjiRequest,
} from '@smart-exam/api-types';
import type { Repositories } from '@/repositories/createRepositories';

import { createCreateKanji } from './createKanji';
import { createDeleteKanji } from './deleteKanji';
import { createDeleteManyKanji } from './deleteManyKanji';
import { createGetKanji } from './getKanji';
import { createImportKanji } from './importKanji';
import { createListKanji } from './listKanji';
import { createSearchKanji } from './searchKanji';
import { createUpdateKanji } from './updateKanji';

export type KanjiService = {
  listKanji: () => Promise<Kanji[]>;
  searchKanji: (params: SearchKanjiRequest) => Promise<SearchKanjiResponse>;
  createKanji: (data: CreateKanjiRequest) => Promise<Kanji>;
  getKanji: (id: string) => Promise<Kanji | null>;
  updateKanji: (id: string, data: UpdateKanjiRequest) => Promise<Kanji | null>;
  deleteKanji: (id: string) => Promise<boolean>;
  deleteManyKanji: (ids: string[]) => Promise<void>;
  importKanji: (data: ImportKanjiRequest) => Promise<ImportKanjiResponse>;
};

export const createKanjiService = (repositories: Repositories): KanjiService => {
  const listKanji = createListKanji(repositories);
  const searchKanji = createSearchKanji(repositories);
  const createKanji = createCreateKanji(repositories);
  const getKanji = createGetKanji(repositories);
  const updateKanji = createUpdateKanji(repositories);
  const deleteKanji = createDeleteKanji(repositories);
  const deleteManyKanji = createDeleteManyKanji(repositories);
  const importKanji = createImportKanji(repositories);

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
