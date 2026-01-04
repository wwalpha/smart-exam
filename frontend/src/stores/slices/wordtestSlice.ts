import type { StateCreator } from 'zustand';
import orderBy from 'lodash/orderBy';
import type { WordTestSlice } from '@/stores/store.types';
import type { GradingData } from '@smart-exam/api-types';
import * as WORDTEST_API from '@/services/wordtestApi';
import { withStatus } from '../utils';

// 単語テスト機能の Zustand slice
export const createWordTestSlice: StateCreator<WordTestSlice, [], [], WordTestSlice> = (set, get) => {
  type WordTestFeatureState = WordTestSlice['wordtest'];
  type WordTestFeaturePatch = Omit<Partial<WordTestFeatureState>, 'status'> & {
    status?: Partial<WordTestFeatureState['status']>;
  };

  const getWordTest = (): WordTestFeatureState => get().wordtest;

  const updateWordTest = (patch: WordTestFeaturePatch) => {
    const current = getWordTest();
    set({
      wordtest: {
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

  const setStatus = (next: Partial<WordTestSlice['wordtest']['status']>) => {
    updateWordTest({ status: next });
  };

  return {
    wordtest: {
      lists: [],
      details: {},
      status: {
        isLoading: false,
        error: null,
      },
    },
    fetchWordTests: async () => {
      await withStatus(
        setStatus,
        async () => {
          // 一覧はサーバー（MSW）側を正として置き換える
          const response = await WORDTEST_API.listWordTests();
          const nextLists = orderBy(response.datas, ['createdAt'], ['desc']);
          updateWordTest({ lists: nextLists });
        },
        '単語テスト一覧の取得に失敗しました。'
      );
    },

    fetchWordTest: async (wordTestId) => {
      return await withStatus(
        setStatus,
        async () => {
          const response = await WORDTEST_API.getWordTest({ wordTestId });

          const current = getWordTest();
          // 詳細取得は items（問題/答え）を含むため、details に保持する
          const nextDetails = {
            ...current.details,
            [response.id]: response,
          };

          updateWordTest({ details: nextDetails });

          return response;
        },
        '単語テストの取得に失敗しました。',
        { fallback: null }
      );
    },

    createWordTest: async (request) => {
      return await withStatus(
        setStatus,
        async () => {
          // 作成結果を即時に store に反映し、画面のリロード無しで一覧へ反映する
          const response = await WORDTEST_API.createWordTest(request);
          const current = getWordTest();
          const nextLists = orderBy([response, ...current.lists], ['createdAt'], ['desc']);
          updateWordTest({ lists: nextLists });
          return response;
        },
        '単語テストの作成に失敗しました。',
        { rethrow: true }
      );
    },

    applyWordTestGrading: async (wordTestId, datas) => {
      await withStatus(
        setStatus,
        async () => {
          const gradingByQid = new Map<string, GradingData['grading']>(datas.map((x) => [x.qid, x.grading]));

          // 採点は「反映する」操作で API に送信し、結果は store に保持して画面遷移しても復元できるようにする
          await WORDTEST_API.applyWordTestGrading(wordTestId, { results: datas });

          // 採点反映後、一覧を再取得して最新状態にする
          const listResponse = await WORDTEST_API.listWordTests();
          const refreshedLists = orderBy(listResponse.datas, ['createdAt'], ['desc']);

          const current = getWordTest();

          const currentDetail = current.details[wordTestId];
          const nextDetails = currentDetail
            ? {
                ...current.details,
                [wordTestId]: {
                  ...currentDetail,
                  items: currentDetail.items.map((item) => ({
                    ...item,
                    grading: gradingByQid.get(item.qid) ?? item.grading,
                  })),
                },
              }
            : current.details;

          updateWordTest({
            lists: refreshedLists,
            details: nextDetails,
          });
        },
        '採点結果の反映に失敗しました。'
      );
    },
  };
};
