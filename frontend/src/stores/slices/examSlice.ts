import type { StateCreator } from 'zustand';
import orderBy from 'lodash/orderBy';
import type { ExamSlice } from '@/stores/store.types';
import type { GradingData } from '@smart-exam/api-types';
import * as WORDTEST_API from '@/services/wordtestApi';
import * as REVIEW_API from '@/services/reviewApi';
import { withStatus } from '../utils';

export const createExamSlice: StateCreator<ExamSlice, [], [], ExamSlice> = (set, get) => {
  type WordTestFeatureState = ExamSlice['wordtest'];
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

  type ReviewState = ExamSlice['review'];
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

    fetchExams: async (params) => {
      await withStatus(
        setReviewStatus,
        async () => {
          const response = await REVIEW_API.listExams(params);
          updateReview({ list: response.items, total: response.total });
        },
        '復習テスト一覧の取得に失敗しました。',
        { rethrow: true },
      );
    },

    createExam: async (request) => {
      return await withStatus(
        setReviewStatus,
        async () => {
          return await REVIEW_API.createExam(request);
        },
        '復習テストの作成に失敗しました。',
        { rethrow: true },
      );
    },

    fetchExam: async (id, mode) => {
      await withStatus(
        setReviewStatus,
        async () => {
          const response = await REVIEW_API.getExamByMode(id, mode);
          updateReview({ detail: response });
        },
        '復習テスト詳細の取得に失敗しました。',
        { rethrow: true },
      );
    },

    updateExamStatus: async (id, request, mode) => {
      await withStatus(
        setReviewStatus,
        async () => {
          const response = await REVIEW_API.updateExamStatusByMode(id, request, mode);
          const currentDetail = getReview().detail;
          const currentList = getReview().list;
          if (currentDetail && currentDetail.examId === id) {
            updateReview({ detail: { ...currentDetail, status: response.status } });
          }

          if (currentList.length > 0) {
            updateReview({
              list: currentList.map((item) => (item.examId === id ? { ...item, status: response.status } : item)),
            });
          }
        },
        'ステータスの更新に失敗しました。',
        { rethrow: true },
      );
    },

    completeExam: async (id) => {
      await withStatus(
        setReviewStatus,
        async () => {
          await REVIEW_API.completeExam(id);

          const currentDetail = getReview().detail;
          const currentList = getReview().list;
          if (currentDetail && currentDetail.examId === id) {
            updateReview({ detail: { ...currentDetail, status: 'COMPLETED' } });
          }

          if (currentList.length > 0) {
            updateReview({
              list: currentList.map((item) => (item.examId === id ? { ...item, status: 'COMPLETED' } : item)),
            });
          }
        },
        '完了処理に失敗しました。',
        { rethrow: true },
      );
    },

    deleteExam: async (id, mode) => {
      await withStatus(
        setReviewStatus,
        async () => {
          await REVIEW_API.deleteExamByMode(id, mode);

          const current = getReview();
          const nextList = current.list.filter((x) => x.examId !== id);
          const nextTotal = current.total > 0 ? Math.max(0, current.total - 1) : current.total;
          const nextDetail = current.detail && current.detail.examId === id ? null : current.detail;
          updateReview({ list: nextList, total: nextTotal, detail: nextDetail });
        },
        '復習テストの削除に失敗しました。',
        { rethrow: true },
      );
    },

    submitExamResults: async (id, request, mode) => {
      await withStatus(
        setReviewStatus,
        async () => {
          await REVIEW_API.submitExamResultsByMode(id, request, mode);
        },
        'テスト結果の送信に失敗しました。',
        { rethrow: true },
      );
    },

    fetchExamTargets: async (params) => {
      const setTargetsStatus = (next: Partial<ExamSlice['reviewTargets']['status']>) => {
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
          const response = await REVIEW_API.listExamTargets(params);
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
  };
};
