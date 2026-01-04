import type { StateCreator } from 'zustand';
import orderBy from 'lodash/orderBy';
import type { WordMasterSlice } from '@/stores/store.types';
import * as WORDMASTER_API from '@/services/wordMasterApi';
import { withStatus } from '../utils';

export const createWordMasterSlice: StateCreator<WordMasterSlice, [], [], WordMasterSlice> = (set, get) => {
  type WordMasterFeatureState = WordMasterSlice['wordmaster'];
  type WordMasterFeaturePatch = Omit<Partial<WordMasterFeatureState>, 'status'> & {
    status?: Partial<WordMasterFeatureState['status']>;
  };

  const getWordMaster = (): WordMasterFeatureState => get().wordmaster;

  const updateWordMaster = (patch: WordMasterFeaturePatch) => {
    const current = getWordMaster();
    set({
      wordmaster: {
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

  const setStatus = (next: Partial<WordMasterSlice['wordmaster']['status']>) => {
    updateWordMaster({ status: next });
  };



  return {
    wordmaster: {
      groups: [],
      status: {
        isLoading: false,
        error: null,
      },
    },

    fetchWordGroups: async () => {
      await withStatus(setStatus, async () => {
        const response = await WORDMASTER_API.listWordGroups();
        const sorted = orderBy(response.datas, ['created_at'], ['desc']);
        updateWordMaster({ groups: sorted });
      }, '単語グループ一覧の取得に失敗しました。');
    },

    createWordGroup: async (request) => {
      return await withStatus(
        setStatus,
        async () => {
          const response = await WORDMASTER_API.createWordGroup(request);
          const current = getWordMaster();
          const nextGroups = orderBy([response, ...current.groups], ['created_at'], ['desc']);
          updateWordMaster({ groups: nextGroups });
          return response;
        },
        '単語グループの作成に失敗しました。',
        { rethrow: true }
      );
    },
  };
};
