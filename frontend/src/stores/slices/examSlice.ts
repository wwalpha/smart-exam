import type { StateCreator } from 'zustand';
import orderBy from 'lodash/orderBy';
import type { ReviewTestSlice } from '@/stores/store.types';
import type { GradingData } from '@smart-exam/api-types';
import * as WORDTEST_API from '@/services/wordtestApi';
import * as REVIEW_API from '@/services/reviewApi';
import * as REVIEW_ATTEMPT_API from '@/services/reviewAttemptApi';
import { withStatus } from '../utils';

export const createReviewTestSlice: StateCreator<ReviewTestSlice, [], [], ReviewTestSlice> = (set, get) => {
  type WordTestFeatureState = ReviewTestSlice['wordtest'];
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

  const setWordTestStatus = (next: Partial<WordTestFeatureState['status']>) => {
    updateWordTest({ status: next });
  };

  type ReviewState = ReviewTestSlice['review'];
  type ReviewPatch = Partial<ReviewState>;

  const getReview = (): ReviewState => get().review;

  const updateReview = (patch: ReviewPatch) => {
    const current = getReview();
    set({
      review: {
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

  const setReviewStatus = (next: Partial<ReviewState['status']>) => {
    const current = getReview();
    updateReview({
      status: {
        ...current.status,
        ...next,
      },
    });
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
        setWordTestStatus,
        async () => {
          const response = await WORDTEST_API.listWordTests();
          const nextLists = orderBy(response.datas, ['createdAt'], ['desc']);
          updateWordTest({ lists: nextLists });
        },
        '単語テスト一覧の取得に失敗しました。',
      );
    },

    fetchWordTest: async (wordTestId) => {
      return await withStatus(
        setWordTestStatus,
        async () => {
          const response = await WORDTEST_API.getWordTest({ wordTestId });

          const current = getWordTest();
          const nextDetails = {
            ...current.details,
            [response.id]: response,
          };

          updateWordTest({ details: nextDetails });

          return response;
        },
        '単語テストの取得に失敗しました。',
        { fallback: null },
      );
    },

    createWordTest: async (request) => {
      return await withStatus(
        setWordTestStatus,
        async () => {
          const response = await WORDTEST_API.createWordTest(request);
          const current = getWordTest();
          const nextLists = orderBy([response, ...current.lists], ['createdAt'], ['desc']);
          updateWordTest({ lists: nextLists });
          return response;
        },
        '単語テストの作成に失敗しました。',
        { rethrow: true },
      );
    },

    applyWordTestGrading: async (wordTestId, datas) => {
      await withStatus(
        setWordTestStatus,
        async () => {
          const gradingByQid = new Map<string, GradingData['grading']>(datas.map((x) => [x.qid, x.grading]));

          await WORDTEST_API.applyWordTestGrading(wordTestId, { results: datas });

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
        '採点結果の反映に失敗しました。',
      );
    },

    review: {
      list: [],
      total: 0,
      detail: null,
      status: {
        isLoading: false,
        error: null,
      },
    },

    reviewTargets: {
      items: [],
      status: {
        isLoading: false,
        error: null,
      },
    },

    reviewAttempts: {
      items: [],
      status: {
        isLoading: false,
        error: null,
      },
    },

    reviewCandidates: {
      items: [],
      status: {
        isLoading: false,
        error: null,
      },
    },

    fetchReviewTests: async (params) => {
      await withStatus(
        setReviewStatus,
        async () => {
          const response = await REVIEW_API.listReviewTests(params);
          updateReview({ list: response.items, total: response.total });
        },
        '復習テスト一覧の取得に失敗しました。',
        { rethrow: true },
      );
    },

    createReviewTest: async (request) => {
      return await withStatus(
        setReviewStatus,
        async () => {
          return await REVIEW_API.createReviewTest(request);
        },
        '復習テストの作成に失敗しました。',
        { rethrow: true },
      );
    },

    fetchReviewTest: async (id, mode) => {
      await withStatus(
        setReviewStatus,
        async () => {
          const response = await REVIEW_API.getReviewTestByMode(id, mode);
          updateReview({ detail: response });
        },
        '復習テスト詳細の取得に失敗しました。',
        { rethrow: true },
      );
    },

    updateReviewTestStatus: async (id, request, mode) => {
      await withStatus(
        setReviewStatus,
        async () => {
          const response = await REVIEW_API.updateReviewTestStatusByMode(id, request, mode);
          const currentDetail = getReview().detail;
          const currentList = getReview().list;
          if (currentDetail && currentDetail.id === id) {
            updateReview({ detail: { ...currentDetail, status: response.status } });
          }

          if (currentList.length > 0) {
            updateReview({
              list: currentList.map((item) => (item.id === id ? { ...item, status: response.status } : item)),
            });
          }
        },
        'ステータスの更新に失敗しました。',
        { rethrow: true },
      );
    },

    deleteReviewTest: async (id, mode) => {
      await withStatus(
        setReviewStatus,
        async () => {
          await REVIEW_API.deleteReviewTestByMode(id, mode);

          const current = getReview();
          const nextList = current.list.filter((x) => x.id !== id);
          const nextTotal = current.total > 0 ? Math.max(0, current.total - 1) : current.total;
          const nextDetail = current.detail && current.detail.id === id ? null : current.detail;
          updateReview({ list: nextList, total: nextTotal, detail: nextDetail });
        },
        '復習テストの削除に失敗しました。',
        { rethrow: true },
      );
    },

    submitReviewTestResults: async (id, request, mode) => {
      await withStatus(
        setReviewStatus,
        async () => {
          await REVIEW_API.submitReviewTestResultsByMode(id, request, mode);
        },
        'テスト結果の送信に失敗しました。',
        { rethrow: true },
      );
    },

    fetchReviewTestTargets: async (params) => {
      const setTargetsStatus = (next: Partial<ReviewTestSlice['reviewTargets']['status']>) => {
        const current = get().reviewTargets;
        set({
          reviewTargets: {
            ...current,
            status: {
              ...current.status,
              ...next,
            },
          },
        });
      };

      await withStatus(
        setTargetsStatus,
        async () => {
          const response = await REVIEW_API.listReviewTestTargets(params);
          set({
            reviewTargets: {
              items: response.items,
              status: get().reviewTargets.status,
            },
          });
        },
        '対象一覧の取得に失敗しました。',
        { rethrow: true },
      );
    },

    fetchReviewAttempts: async (params) => {
      const setAttemptsStatus = (next: Partial<ReviewTestSlice['reviewAttempts']['status']>) => {
        const current = get().reviewAttempts;
        set({
          reviewAttempts: {
            ...current,
            status: {
              ...current.status,
              ...next,
            },
          },
        });
      };

      await withStatus(
        setAttemptsStatus,
        async () => {
          const response = await REVIEW_ATTEMPT_API.listReviewAttempts(params);
          set({
            reviewAttempts: {
              items: response.items,
              status: get().reviewAttempts.status,
            },
          });
        },
        '履歴の取得に失敗しました。',
        { rethrow: true },
      );
    },

    fetchReviewTestCandidates: async (params) => {
      const setCandidatesStatus = (next: Partial<ReviewTestSlice['reviewCandidates']['status']>) => {
        const current = get().reviewCandidates;
        set({
          reviewCandidates: {
            ...current,
            status: {
              ...current.status,
              ...next,
            },
          },
        });
      };

      await withStatus(
        setCandidatesStatus,
        async () => {
          const response = await REVIEW_API.listReviewTestCandidates(params);
          set({
            reviewCandidates: {
              items: response.items,
              status: get().reviewCandidates.status,
            },
          });
        },
        '候補一覧の取得に失敗しました。',
        { rethrow: true },
      );
    },
  };
};
