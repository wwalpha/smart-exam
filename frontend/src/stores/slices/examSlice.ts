import type { StateCreator } from 'zustand';
import orderBy from 'lodash/orderBy';
import type { ExamSlice } from '@typings/store';
import * as EXAM_API from '@/services/examApi';

export const createExamSlice: StateCreator<ExamSlice, [], [], ExamSlice> = (set, get) => {
  type ExamFeatureState = ExamSlice['exam'];
  type ExamFeaturePatch = Omit<Partial<ExamFeatureState>, 'status'> & {
    status?: Partial<ExamFeatureState['status']>;
  };

  const getExam = (): ExamFeatureState => get().exam;

  const updateExam = (patch: ExamFeaturePatch) => {
    const current = getExam();
    set({
      exam: {
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

  const setStatus = (next: Partial<ExamSlice['exam']['status']>) => {
    updateExam({ status: next });
  };

  const withExamStatus = async <T>(
    fn: (helpers: { getExam: () => ExamFeatureState; updateExam: (patch: ExamFeaturePatch) => void }) => Promise<T>,
    errorMessage: string,
    options?: {
      fallback?: T;
      rethrow?: boolean;
    }
  ): Promise<T> => {
    setStatus({ isLoading: true, error: null });
    try {
      const result = await fn({ getExam, updateExam });
      setStatus({ isLoading: false });
      return result;
    } catch (error) {
      console.error(error);
      setStatus({ isLoading: false, error: errorMessage });
      if (options?.rethrow) throw error;
      return options?.fallback as T;
    }
  };

  return {
    exam: {
      papers: [],
      results: [],
      status: {
        isLoading: false,
        error: null,
      },
    },

    fetchExamPapers: async () => {
      await withExamStatus(async ({ updateExam }) => {
        const response = await EXAM_API.listExamPapers();
        const sorted = orderBy(response.datas, ['created_at'], ['desc']);
        updateExam({ papers: sorted });
      }, '試験問題一覧の取得に失敗しました。');
    },

    createExamPaper: async (request) => {
      await withExamStatus(async ({ getExam, updateExam }) => {
        const response = await EXAM_API.createExamPaper(request);
        const current = getExam();
        const nextPapers = orderBy([response, ...current.papers], ['created_at'], ['desc']);
        updateExam({ papers: nextPapers });
      }, '試験問題の登録に失敗しました。');
    },

    fetchExamResults: async () => {
      await withExamStatus(async ({ updateExam }) => {
        const response = await EXAM_API.listExamResults();
        const sorted = orderBy(response.datas, ['test_date', 'created_at'], ['desc', 'desc']);
        updateExam({ results: sorted });
      }, '試験結果一覧の取得に失敗しました。');
    },

    createExamResult: async (request) => {
      await withExamStatus(async ({ getExam, updateExam }) => {
        const response = await EXAM_API.createExamResult(request);
        const current = getExam();
        const nextResults = orderBy([response, ...current.results], ['test_date', 'created_at'], ['desc', 'desc']);
        updateExam({ results: nextResults });
      }, '試験結果の登録に失敗しました。');
    },
  };
};
