import type { StateCreator } from 'zustand';
import type { KanjiSlice } from '@/stores/store.types';
import * as KANJI_API from '@/services/kanjiApi';
import { withStatus } from '../utils';

export const createKanjiSlice: StateCreator<KanjiSlice, [], [], KanjiSlice> = (set, get) => {
  type KanjiState = KanjiSlice['kanji'];
  type KanjiPatch = Partial<KanjiState>;

  const getKanji = (): KanjiState => get().kanji;

  const updateKanji = (patch: KanjiPatch) => {
    const current = getKanji();
    set({
      kanji: {
        ...current,
        ...patch,
        status: patch.status
          ? {
              ...current.status,
              ...patch.status,
            }
          : current.status,
      },
    });
  };

  const setStatus = (next: Partial<KanjiState['status']>) => {
    const current = getKanji();
    updateKanji({
      status: {
        ...current.status,
        ...next,
      },
    });
  };



  return {
    kanji: {
      list: [],
      total: 0,
      detail: null,
      status: {
        isLoading: false,
        error: null,
      },
    },

    fetchKanjiList: async (params) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await KANJI_API.listKanji(params);
          updateKanji({ list: response.items, total: response.total });
        },
        '漢字一覧の取得に失敗しました。',
        { rethrow: true }
      );
    },

    createKanji: async (request) => {
      await withStatus(
        setStatus,
        async () => {
          await KANJI_API.createKanji(request);
        },
        '漢字の作成に失敗しました。',
        { rethrow: true }
      );
    },

    fetchKanji: async (id) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await KANJI_API.getKanji(id);
          updateKanji({ detail: response });
        },
        '漢字詳細の取得に失敗しました。',
        { rethrow: true }
      );
    },

    updateKanji: async (id, request) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await KANJI_API.updateKanji(id, request);
          updateKanji({ detail: response });
        },
        '漢字の更新に失敗しました。',
        { rethrow: true }
      );
    },

    deleteKanji: async (id) => {
      await withStatus(
        setStatus,
        async () => {
          await KANJI_API.deleteKanji(id);
        },
        '漢字の削除に失敗しました。',
        { rethrow: true }
      );
    },

    importKanji: async (request) => {
      return await withStatus(
        setStatus,
        async () => {
          return await KANJI_API.importKanji(request);
        },
        '漢字のインポートに失敗しました。',
        { rethrow: true }
      );
    },
  };
};
