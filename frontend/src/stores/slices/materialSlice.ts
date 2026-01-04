import type { StateCreator } from 'zustand';
import type { MaterialSlice } from '@/stores/store.types';
import * as MATERIAL_API from '@/services/materialApi';
import * as EXAM_API from '@/services/examApi';
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

          const hasSearchParams =
            !!params &&
            Object.values(params).some((v) => v !== undefined && v !== null && String(v).trim().length > 0);

          if (hasSearchParams && response.items.length === 0) {
            return;
          }

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

    createMaterialSetWithUpload: async (params) => {
      return await withStatus(
        setStatus,
        async () => {
          const materialSet = await MATERIAL_API.createMaterialSet(params.request);

          const uploads: Array<{ fileType: 'QUESTION' | 'ANSWER' | 'GRADED_ANSWER'; file: File }> = [];
          if (params.questionFile) uploads.push({ fileType: 'QUESTION', file: params.questionFile });
          if (params.answerFile) uploads.push({ fileType: 'ANSWER', file: params.answerFile });
          if (params.gradedFile) uploads.push({ fileType: 'GRADED_ANSWER', file: params.gradedFile });

          for (const upload of uploads) {
            const prefix = `materials/${materialSet.id}/${upload.fileType}`;
            const presigned = await EXAM_API.getUploadUrl(upload.file.name, upload.file.type, prefix);
            await EXAM_API.uploadFileToS3(presigned.uploadUrl, upload.file);
          }

          // ファイル一覧を即時反映
          const files = await MATERIAL_API.listMaterialFiles(materialSet.id);
          updateMaterial({ files });

          return materialSet;
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

    deleteMaterialSet: async (id) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.deleteMaterialSet(id);

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
        { rethrow: true }
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
