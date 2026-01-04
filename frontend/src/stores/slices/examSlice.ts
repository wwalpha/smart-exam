import type { StateCreator } from 'zustand';
import orderBy from 'lodash/orderBy';
import type { ExamSlice } from '@/stores/store.types';
import * as EXAM_API from '@/services/examApi';
import { withStatus } from '../utils';

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
      await withStatus(setStatus, async () => {
        const response = await EXAM_API.listExamPapers();
        const sorted = orderBy(response.datas, ['createdAt'], ['desc']);
        updateExam({ papers: sorted });
      }, '試験問題一覧の取得に失敗しました。');
    },

    createExamPaper: async (request) => {
      await withStatus(setStatus, async () => {
        const response = await EXAM_API.createExamPaper(request);
        const current = getExam();
        const nextPapers = orderBy([response, ...current.papers], ['createdAt'], ['desc']);
        updateExam({ papers: nextPapers });
      }, '試験問題の登録に失敗しました。');
    },

    createExamPaperWithUpload: async (params) => {
      await withStatus(setStatus, async () => {
        // Upload Question PDF
        const qUpload = await EXAM_API.getUploadUrl(params.questionFile.name, params.questionFile.type);
        await EXAM_API.uploadFileToS3(qUpload.uploadUrl, params.questionFile);

        // Upload Answer PDF
        const aUpload = await EXAM_API.getUploadUrl(params.answerFile.name, params.answerFile.type);
        await EXAM_API.uploadFileToS3(aUpload.uploadUrl, params.answerFile);

        // Create Paper Record
        const request = {
          grade: params.grade,
          subject: params.subject,
          category: params.category,
          name: params.name,
          questionPdfKey: qUpload.fileKey,
          answerPdfKey: aUpload.fileKey,
        };
        const response = await EXAM_API.createExamPaper(request);
        const current = getExam();
        const nextPapers = orderBy([response, ...current.papers], ['createdAt'], ['desc']);
        updateExam({ papers: nextPapers });
      }, '試験問題の登録に失敗しました。');
    },

    fetchExamResults: async () => {
      await withStatus(setStatus, async () => {
        const response = await EXAM_API.listExamResults();
        const sorted = orderBy(response.datas, ['testDate', 'createdAt'], ['desc', 'desc']);
        updateExam({ results: sorted });
      }, '試験結果一覧の取得に失敗しました。');
    },

    createExamResult: async (request) => {
      await withStatus(setStatus, async () => {
        const response = await EXAM_API.createExamResult(request);
        const current = getExam();
        const nextResults = orderBy([response, ...current.results], ['testDate', 'createdAt'], ['desc', 'desc']);
        updateExam({ results: nextResults });
      }, '試験結果の登録に失敗しました。');
    },

    createExamResultWithUpload: async (params) => {
      await withStatus(setStatus, async () => {
        let gradedPdfKey = undefined;
        if (params.gradedFile) {
          const upload = await EXAM_API.getUploadUrl(params.gradedFile.name, params.gradedFile.type);
          await EXAM_API.uploadFileToS3(upload.uploadUrl, params.gradedFile);
          gradedPdfKey = upload.fileKey;
        }

        const request = {
          grade: params.grade,
          subject: params.subject,
          category: params.category,
          name: params.name,
          title: params.title,
          testDate: params.testDate,
          gradedPdfKey: gradedPdfKey,
          details: params.details,
        };
        const response = await EXAM_API.createExamResult(request);
        const current = getExam();
        const nextResults = orderBy([response, ...current.results], ['testDate', 'createdAt'], ['desc', 'desc']);
        updateExam({ results: nextResults });
      }, '試験結果の登録に失敗しました。');
    },
  };
};
