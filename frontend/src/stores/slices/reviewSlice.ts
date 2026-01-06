import type { StateCreator } from 'zustand';
import type { ReviewSlice } from '@/stores/store.types';
import * as REVIEW_API from '@/services/reviewApi';
import * as REVIEW_ATTEMPT_API from '@/services/reviewAttemptApi';
import { withStatus } from '../utils';

export const createReviewSlice: StateCreator<ReviewSlice, [], [], ReviewSlice> = (set, get) => {
  type ReviewState = ReviewSlice['review'];
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

  const setStatus = (next: Partial<ReviewState['status']>) => {
    const current = getReview();
    updateReview({
      status: {
        ...current.status,
        ...next,
      },
    });
  };

  return {
    review: {
      list: [],
      total: 0,
      detail: null,
      status: {
        isLoading: false,
        error: null,
      },
    },

    reviewAttempt: {
      items: [],
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

    fetchReviewTests: async (params) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await REVIEW_API.listReviewTests(params);
          updateReview({ list: response.items, total: response.total });
        },
        '復習テスト一覧の取得に失敗しました。',
        { rethrow: true }
      );
    },

    createReviewTest: async (request) => {
      return await withStatus(
        setStatus,
        async () => {
          return await REVIEW_API.createReviewTest(request);
        },
        '復習テストの作成に失敗しました。',
        { rethrow: true }
      );
    },

    fetchReviewTest: async (id) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await REVIEW_API.getReviewTest(id);
          updateReview({ detail: response });
        },
        '復習テスト詳細の取得に失敗しました。',
        { rethrow: true }
      );
    },

    updateReviewTestStatus: async (id, request) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await REVIEW_API.updateReviewTestStatus(id, request);
          // Update detail if it matches
          const currentDetail = getReview().detail;
          if (currentDetail && currentDetail.id === id) {
            updateReview({ detail: { ...currentDetail, status: response.status } });
          }
        },
        'ステータスの更新に失敗しました。',
        { rethrow: true }
      );
    },

    deleteReviewTest: async (id) => {
      await withStatus(
        setStatus,
        async () => {
          await REVIEW_API.deleteReviewTest(id);
        },
        '復習テストの削除に失敗しました。',
        { rethrow: true }
      );
    },

    submitReviewTestResults: async (id, request) => {
      await withStatus(
        setStatus,
        async () => {
          await REVIEW_API.submitReviewTestResults(id, request);
        },
        'テスト結果の送信に失敗しました。',
        { rethrow: true }
      );
    },

    fetchReviewTestTargets: async (params) => {
      const setTargetsStatus = (next: Partial<ReviewSlice['reviewTargets']['status']>) => {
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
        { rethrow: true }
      );
    },

    fetchReviewAttempts: async (params) => {
      const setAttemptStatus = (next: Partial<ReviewSlice['reviewAttempt']['status']>) => {
        const current = get().reviewAttempt;
        set({
          reviewAttempt: {
            ...current,
            status: {
              ...current.status,
              ...next,
            },
          },
        });
      };

      await withStatus(
        setAttemptStatus,
        async () => {
          const response = await REVIEW_ATTEMPT_API.listReviewAttempts(params);
          set({
            reviewAttempt: {
              items: response.items,
              status: get().reviewAttempt.status,
            },
          });
        },
        '履歴の取得に失敗しました。',
        { rethrow: true }
      );
    },

    upsertReviewAttempt: async (request) => {
      const setAttemptStatus = (next: Partial<ReviewSlice['reviewAttempt']['status']>) => {
        const current = get().reviewAttempt;
        set({
          reviewAttempt: {
            ...current,
            status: {
              ...current.status,
              ...next,
            },
          },
        });
      };

      await withStatus(
        setAttemptStatus,
        async () => {
          await REVIEW_ATTEMPT_API.upsertReviewAttempt(request);
        },
        '履歴の保存に失敗しました。',
        { rethrow: true }
      );
    },

    deleteReviewAttempt: async (request) => {
      const setAttemptStatus = (next: Partial<ReviewSlice['reviewAttempt']['status']>) => {
        const current = get().reviewAttempt;
        set({
          reviewAttempt: {
            ...current,
            status: {
              ...current.status,
              ...next,
            },
          },
        });
      };

      await withStatus(
        setAttemptStatus,
        async () => {
          await REVIEW_ATTEMPT_API.deleteReviewAttempt(request);
        },
        '履歴の削除に失敗しました。',
        { rethrow: true }
      );
    },
  };
};
