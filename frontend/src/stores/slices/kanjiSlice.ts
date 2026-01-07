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

          const current = getKanji();
          const nextList = current.list.filter((x) => x.id !== id);
          updateKanji({
            list: nextList,
            total: Math.max(0, current.total - (nextList.length === current.list.length ? 0 : 1)),
            detail: current.detail?.id === id ? null : current.detail,
          });
        },
        '漢字の削除に失敗しました。',
        { rethrow: true }
      );
    },

    deleteManyKanji: async (ids) => {
      await withStatus(
        setStatus,
        async () => {
          const uniqueIds = Array.from(new Set((ids ?? []).map((x) => String(x).trim()).filter((x) => x.length > 0)));
          if (uniqueIds.length === 0) return;

          await KANJI_API.deleteManyKanji({ kanjiIds: uniqueIds });

          const current = getKanji();
          const nextList = current.list.filter((x) => !uniqueIds.includes(x.id));
          updateKanji({
            list: nextList,
            total: Math.max(0, current.total - (current.list.length - nextList.length)),
            detail: current.detail && uniqueIds.includes(current.detail.id) ? null : current.detail,
          });
        },
        '漢字の一括削除に失敗しました。',
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
