import type { StateCreator } from 'zustand';
import type { MaterialSlice } from '@/stores/store.types';
import * as MATERIAL_API from '@/services/materialApi';
import * as BEDROCK_API from '@/services/bedrockApi';
import { compareQuestionNumber, normalizeQuestionNumber } from '@/utils/questionNumber';
import { toBedrockPromptSubject } from '@/utils/bedrockSubject';
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

    fetchMaterials: async (params) => {
      await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.listMaterials(params);

          const hasSearchParams =
            !!params && Object.values(params).some((v) => v !== undefined && v !== null && String(v).trim().length > 0);

          if (hasSearchParams && response.items.length === 0) {
            return;
          }

          updateMaterial({ list: response.items, total: response.total });
        },
        '教材セット一覧の取得に失敗しました。',
        { rethrow: true }
      );
    },

    createMaterial: async (request) => {
      return await withStatus(
        setStatus,
        async () => {
          const response = await MATERIAL_API.createMaterial(request);
          // Optionally refresh list or add to list
          return response;
        },
        '教材セットの作成に失敗しました。',
        { rethrow: true }
      );
    },

    createMaterialWithUpload: async (params) => {
      return await withStatus(
        setStatus,
        async () => {
          const material = await MATERIAL_API.createMaterial(params.request);

          const uploads: Array<{ fileType: 'QUESTION' | 'ANSWER' | 'GRADED_ANSWER'; file: File }> = [];
          if (params.questionFile) uploads.push({ fileType: 'QUESTION', file: params.questionFile });
          if (params.answerFile) uploads.push({ fileType: 'ANSWER', file: params.answerFile });
          if (params.gradedFile) uploads.push({ fileType: 'GRADED_ANSWER', file: params.gradedFile });

          for (const upload of uploads) {
            const presigned = await MATERIAL_API.uploadMaterialFile(material.id, {
              contentType: upload.file.type,
              fileName: upload.file.name,
              filetype: upload.fileType,
            });
            await MATERIAL_API.uploadFileToS3(presigned.uploadUrl, upload.file);
          }

          // ファイル一覧を即時反映
          const files = await MATERIAL_API.listMaterialFiles(material.id);
          updateMaterial({ files });

          return material;
        },
        '教材セットの作成に失敗しました。',
        { rethrow: true }
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
        { rethrow: true }
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
        { rethrow: true }
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
        { rethrow: true }
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

    extractQuestionsFromGradedAnswer: async (materialId) => {
      await withStatus(
        setStatus,
        async () => {
          const current = getMaterial();
          if (current.detail?.id !== materialId) return;
          if (current.questions.length > 0) return;

          const graded = current.files.find(
            (f) => f.fileType === 'GRADED_ANSWER' && f.filename.toLowerCase().endsWith('.pdf')
          );
          if (!graded) return;

          const response = await BEDROCK_API.analyzePaper({
            s3Key: graded.s3Key,
            subject: toBedrockPromptSubject(current.detail.subject),
          });

          const normalized = (response.questions ?? [])
            .map(normalizeQuestionNumber)
            .filter((x): x is string => typeof x === 'string');

          const unique = Array.from(new Set(normalized)).sort(compareQuestionNumber);
          if (unique.length === 0) return;

          for (const key of unique) {
            await MATERIAL_API.createQuestion(materialId, {
              canonicalKey: key,
              subject: current.detail.subject,
            });
          }

          const nextQuestions = await MATERIAL_API.listQuestions(materialId);
          updateMaterial({ questions: nextQuestions });
        },
        '問題番号の抽出に失敗しました。',
        { rethrow: false }
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
        { rethrow: true }
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
        { rethrow: true }
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
        { rethrow: true }
      );
    },

    deleteQuestion: async (materialId, questionId) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.deleteQuestion(materialId, questionId);
        },
        '問題の削除に失敗しました。',
        { rethrow: true }
      );
    },

    markQuestionCorrect: async (materialId, questionId) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.setQuestionChoice(materialId, questionId, { isCorrect: true });
        },
        '採点結果（正解）の登録に失敗しました。',
        { rethrow: true }
      );
    },

    markQuestionIncorrect: async (materialId, questionId) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.setQuestionChoice(materialId, questionId, { isCorrect: false });
        },
        '採点結果（不正解）の登録に失敗しました。',
        { rethrow: true }
      );
    },

    setQuestionChoice: async (materialId, questionId, isCorrect) => {
      await withStatus(
        setStatus,
        async () => {
          await MATERIAL_API.setQuestionChoice(materialId, questionId, { isCorrect });
        },
        '採点結果の登録に失敗しました。',
        { rethrow: true }
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
        { rethrow: true }
      );
    },
  };
};
