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
      detail: null,
      files: [],
      questions: [],
      status: {
        isLoading: false,
        error: null,
      },
    },

    fetchMaterialSets: async (params) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.listMaterialSets(params);
          updateMaterial({ list: response.items, total: response.total });
        },
        '教材セット一覧の取得に失敗しました。',
        { rethrow: true }
      );
    },

    createMaterialSet: async (request) => {
      return await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.createMaterialSet(request);
          // Optionally refresh list or add to list
          return response;
        },
        '教材セットの作成に失敗しました。',
        { rethrow: true }
      );
    },

    fetchMaterialSet: async (id) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.getMaterialSet(id);
          updateMaterial({ detail: response });
        },
        '教材セット詳細の取得に失敗しました。',
        { rethrow: true }
      );
    },

    updateMaterialSet: async (id, request) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.updateMaterialSet(id, request);
          updateMaterial({ detail: response });
        },
        '教材セットの更新に失敗しました。',
        { rethrow: true }
      );
    },

    fetchMaterialFiles: async (id) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.listMaterialFiles(id);
          updateMaterial({ files: Array.isArray(response) ? response : [] });
        },
        '教材ファイル一覧の取得に失敗しました。',
        { rethrow: true }
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
        { rethrow: true }
      );
    },

    createQuestion: async (materialSetId, request) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.createQuestion(materialSetId, request);
          // Refresh questions
          const response = await MATERIAL_API.listQuestions(materialSetId);
          updateMaterial({ questions: response });
        },
        '問題の作成に失敗しました。',
        { rethrow: true }
      );
    },

    updateQuestion: async (questionId, request) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.updateQuestion(questionId, request);
          // Note: Ideally we should update the specific item in the list without refetching
          // But for simplicity, we might rely on refetching or just updating local state if we had the materialSetId
        },
        '問題の更新に失敗しました。',
        { rethrow: true }
      );
    },

    deleteQuestion: async (questionId) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.deleteQuestion(questionId);
        },
        '問題の削除に失敗しました。',
        { rethrow: true }
      );
    },
  };
};
