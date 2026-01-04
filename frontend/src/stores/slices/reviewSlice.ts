import type { StateCreator } from 'zustand';
import type { ReviewSlice } from '@/stores/store.types';
import * as REVIEW_API from '@/services/reviewApi';
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
  };
};
