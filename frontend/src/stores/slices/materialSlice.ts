import type { StateCreator } from 'zustand';
import type { MaterialSlice } from '@/stores/store.types';
import * as MATERIAL_API from '@/services/materialApi';
import { withStatus } from '../utils';

export const createMaterialSlice: StateCreator<MaterialSlice, [], [], MaterialSlice> = (set, get) => {
  type MaterialState = MaterialSlice['material'];
  type MaterialPatch = Partial<MaterialState>;

  const getMaterial = (): MaterialState => get().material;

  const updateMaterial = (patch: MaterialPatch) => {
    const current = getMaterial();
    set({
      material: {
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

  const setStatus = (next: Partial<MaterialState['status']>) => {
    const current = getMaterial();
    updateMaterial({
      status: {
        ...current.status,
        ...next,
      },
    });
  };

  return {
    material: {
      list: [],
      total: 0,
      openCandidateList: [],
      openCandidateTotal: 0,
      detail: null,
      files: [],
      questions: [],
      status: {
        isLoading: false,
        error: null,
      },
    },

    fetchMaterials: async (params) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.listMaterials(params);
          updateMaterial({ list: response.items, total: response.total });
        },
        '教材セット一覧の取得に失敗しました。',
        { rethrow: true },
      );
    },

    fetchOpenCandidateMaterials: async (params) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.listOpenCandidateMaterials(params);
          const openCandidateTotal = response.items.reduce(
            (accumulator, material) => accumulator + material.openCandidateCount,
            0,
          );
          updateMaterial({ openCandidateList: response.items, openCandidateTotal });
        },
        '復習候補教材の取得に失敗しました。',
        { rethrow: true },
      );
    },

    resetMaterialDetail: () => {
      updateMaterial({
        list: [],
        total: 0,
        openCandidateList: [],
        openCandidateTotal: 0,
        detail: null,
        files: [],
        questions: [],
      });
    },

    createMaterial: async (request) => {
      return await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.createMaterial(request);
          return response;
        },
        '教材セットの作成に失敗しました。',
        { rethrow: true },
      );
    },

    uploadMaterialPdf: async (params: {
      materialId: string;
      fileType: 'QUESTION' | 'ANSWER' | 'GRADED_ANSWER';
      file: File;
    }) => {
      await withStatus(
        setStatus,
        async () => {
          const presigned = await MATERIAL_API.uploadMaterialFile(params.materialId, {
            contentType: params.file.type,
            fileName: params.file.name,
            filetype: params.fileType,
          });
          await MATERIAL_API.uploadFileToS3(presigned.uploadUrl, params.file);

          const files = await MATERIAL_API.listMaterialFiles(params.materialId);
          updateMaterial({ files });
        },
        'PDFのアップロードに失敗しました。',
        { rethrow: true },
      );
    },

    fetchMaterial: async (id) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.getMaterial(id);
          updateMaterial({ detail: response });
        },
        '教材セット詳細の取得に失敗しました。',
        { rethrow: true },
      );
    },

    updateMaterial: async (id, request) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.updateMaterial(id, request);
          updateMaterial({ detail: response });
        },
        '教材セットの更新に失敗しました。',
        { rethrow: true },
      );
    },

    deleteMaterial: async (id) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.deleteMaterial(id);

          const current = getMaterial();
          const nextList = current.list.filter((x) => x.id !== id);
          updateMaterial({
            list: nextList,
            total: Math.max(0, current.total - (nextList.length === current.list.length ? 0 : 1)),
            detail: current.detail?.id === id ? null : current.detail,
            files: current.detail?.id === id ? [] : current.files,
            questions: current.detail?.id === id ? [] : current.questions,
          });
        },
        '教材セットの削除に失敗しました。',
        { rethrow: true },
      );
    },

    fetchMaterialFiles: async (id) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.listMaterialFiles(id);
          updateMaterial({ files: response });
        },
        '教材ファイル一覧の取得に失敗しました。',
        { rethrow: true },
      );
    },

    fetchQuestions: async (id) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.listQuestions(id);
          updateMaterial({ questions: response });
        },
        '問題一覧の取得に失敗しました。',
        { rethrow: true },
      );
    },

    extractQuestionsFromGradedAnswer: async (materialId) => {
      await withStatus(
        setStatus,
        async () => {
          const current = getMaterial();
          if (current.detail?.id !== materialId) return;

          const graded = current.files.find(
            (f) => f.fileType === 'GRADED_ANSWER' && f.filename.toLowerCase().endsWith('.pdf'),
          );
          if (!graded) return;

          await MATERIAL_API.analyzeMaterial(materialId);

          const nextQuestions = await MATERIAL_API.listQuestions(materialId);
          updateMaterial({ questions: nextQuestions });
        },
        '問題番号の抽出に失敗しました。',
        { rethrow: false },
      );
    },

    createQuestion: async (materialId, request) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.createQuestion(materialId, request);
          // Refresh questions
          const response = await MATERIAL_API.listQuestions(materialId);
          updateMaterial({ questions: response });
        },
        '問題の作成に失敗しました。',
        { rethrow: true },
      );
    },

    createQuestionsBulk: async (materialId, requests) => {
      await withStatus(
        setStatus,
        async () => {
          for (const request of requests) {
            await MATERIAL_API.createQuestion(materialId, request);
          }

          const response = await MATERIAL_API.listQuestions(materialId);
          updateMaterial({ questions: response });
        },
        '問題の作成に失敗しました。',
        { rethrow: true },
      );
    },

    updateQuestion: async (materialId, questionId, request) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.updateQuestion(materialId, questionId, request);
          // Note: Ideally we should update the specific item in the list without refetching
          // But for simplicity, we might rely on refetching or just updating local state if we had the materialId
        },
        '問題の更新に失敗しました。',
        { rethrow: true },
      );
    },

    deleteQuestion: async (materialId, questionId) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.deleteQuestion(materialId, questionId);
        },
        '問題の削除に失敗しました。',
        { rethrow: true },
      );
    },

    markQuestionCorrect: async (materialId, questionId) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.setQuestionChoice(materialId, questionId, { isCorrect: true });
        },
        '採点結果（正解）の登録に失敗しました。',
        { rethrow: true },
      );
    },

    markQuestionIncorrect: async (materialId, questionId) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.setQuestionChoice(materialId, questionId, { isCorrect: false });
        },
        '採点結果（不正解）の登録に失敗しました。',
        { rethrow: true },
      );
    },

    setQuestionChoice: async (materialId, questionId, isCorrect) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.setQuestionChoice(materialId, questionId, { isCorrect });
        },
        '採点結果の登録に失敗しました。',
        { rethrow: true },
      );
    },

    completeMaterial: async (materialId) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.completeMaterial(materialId);
          updateMaterial({ detail: response });
        },
        '教材セットの完了処理に失敗しました。',
        { rethrow: true },
      );
    },
  };
};
