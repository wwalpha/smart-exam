import type {
	ImportKanjiRequest,
	ImportKanjiResponse,
	Kanji,
	RegistKanjiRequest,
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
	registKanji: (data: RegistKanjiRequest) => Promise<Kanji>;
	getKanji: (id: string) => Promise<Kanji | null>;
	updateKanji: (id: string, data: UpdateKanjiRequest) => Promise<Kanji | null>;
	deleteKanji: (id: string) => Promise<boolean>;
	deleteManyKanji: (ids: string[]) => Promise<void>;
	importKanji: (data: ImportKanjiRequest) => Promise<ImportKanjiResponse>;
};

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
		registKanji: createKanji,
		getKanji,
		updateKanji,
		deleteKanji,
		deleteManyKanji,
		importKanji,
	};
};

// 既存参照向けに別名のサービス生成関数を再エクスポートする
export { createKanjiService as kanjiService };
