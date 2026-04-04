import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Material, MaterialFile, SubjectId } from '@smart-exam/api-types';
import { getMaterialFileDownloadUrl } from '@/services/materialApi';
import * as MATERIAL_API from '@/services/materialApi';
import { compareQuestionNumber } from '@/utils/questionNumber';
import { useReviewQuestionDetail } from './useReviewQuestionDetail';

type PdfAvailability = {
  QUESTION: boolean;
  ANSWER: boolean;
  questionMaterialId?: string;
  answerMaterialId?: string;
};

type ReviewBlock = {
  key: string;
  grade: string;
  provider: string;
  materialDate: string;
  materialName: string;
  materialId: string | null;
  items: Array<NonNullable<ReturnType<typeof useReviewQuestionDetail>['review']>['items'][number]>;
};

const hasQuestionPdfSource = (material: Material | null, files: MaterialFile[]): boolean => {
  return Boolean(material?.hasQuestionPdf) || files.some((file) => file.fileType === 'QUESTION');
};

const hasAnswerPdfSource = (material: Material | null, files: MaterialFile[]): boolean => {
  return Boolean(material?.hasAnswerPdf) || files.some((file) => file.fileType === 'ANSWER');
};

const isSameMaterialMetadata = (block: ReviewBlock, material: Material): boolean => {
  return (
    String(material.grade ?? '') === String(block.grade ?? '') &&
    String(material.provider ?? '') === String(block.provider ?? '') &&
    String(material.materialDate ?? '') === String(block.materialDate ?? '') &&
    String(material.name ?? '') === String(block.materialName ?? '')
  );
};

const resolveBlockPdfAvailability = async (block: ReviewBlock, subject: SubjectId): Promise<PdfAvailability> => {
  const originalMaterialId = block.materialId;

  const [originalMaterialResult, originalFilesResult] = originalMaterialId
    ? await Promise.allSettled([MATERIAL_API.getMaterial(originalMaterialId), MATERIAL_API.listMaterialFiles(originalMaterialId)])
    : [null, null];

  const originalMaterial = originalMaterialResult && originalMaterialResult.status === 'fulfilled' ? originalMaterialResult.value : null;
  const originalFiles = originalFilesResult && originalFilesResult.status === 'fulfilled' ? originalFilesResult.value : [];

  let questionMaterialId = hasQuestionPdfSource(originalMaterial, originalFiles) ? originalMaterialId ?? undefined : undefined;
  let answerMaterialId = hasAnswerPdfSource(originalMaterial, originalFiles) ? originalMaterialId ?? undefined : undefined;

  if (questionMaterialId && answerMaterialId) {
    return {
      QUESTION: true,
      ANSWER: true,
      questionMaterialId,
      answerMaterialId,
    };
  }

  const candidates = await MATERIAL_API.listMaterials({
    subject,
    grade: block.grade || undefined,
    provider: block.provider || undefined,
    from: block.materialDate || undefined,
    to: block.materialDate || undefined,
    q: block.materialName || undefined,
  });

  const siblingMaterials = candidates.items.filter((material) => isSameMaterialMetadata(block, material));

  for (const material of siblingMaterials) {
    if (questionMaterialId && answerMaterialId) {
      break;
    }

    const files = await MATERIAL_API.listMaterialFiles(material.id).catch(() => [] as MaterialFile[]);

    if (!questionMaterialId && hasQuestionPdfSource(material, files)) {
      questionMaterialId = material.id;
    }
    if (!answerMaterialId && hasAnswerPdfSource(material, files)) {
      answerMaterialId = material.id;
    }
  }

  return {
    QUESTION: Boolean(questionMaterialId),
    ANSWER: Boolean(answerMaterialId),
    questionMaterialId,
    answerMaterialId,
  };
};

const pickLatestPdf = (files: MaterialFile[], fileType: MaterialFile['fileType']): MaterialFile | null => {
  const candidates = files.filter((f) => f.fileType === fileType);
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
};

export const useReviewQuestionDetailPage = () => {
  const { review, isLoading, error, basePath, remove, completeExam, ConfirmDialog } = useReviewQuestionDetail();

  const sortedItems = useMemo(() => {
    if (!review) return [];
    if (review.mode !== 'MATERIAL') return review.items;

    // 問題番号ベースの昇順で固定し、画面表示順の揺れを防ぐ
    return [...review.items].sort((a, b) => {
      const aKey = a.canonicalKey?.trim();
      const bKey = b.canonicalKey?.trim();

      if (aKey && bKey) return compareQuestionNumber(aKey, bKey);
      if (aKey) return -1;
      if (bKey) return 1;
      return a.id.localeCompare(b.id);
    });
  }, [review]);

  const blocks = useMemo(() => {
    if (!review) return [];

    const entries = sortedItems;
    const result: ReviewBlock[] = [];
    const byKey = new Map<string, (typeof result)[number]>();

    for (const item of entries) {
      const materialId = item.materialId ?? '';
      const grade = item.grade ?? '';
      const provider = item.provider ?? '';
      const materialDate = item.materialDate ?? '';
      const materialName = item.materialName ?? '';
      const key = [materialId, grade, provider, materialDate, materialName].join('||');

      const existing = byKey.get(key);
      if (existing) {
        existing.items.push(item);
        continue;
      }

      const created = {
        key,
        grade,
        provider,
        materialDate,
        materialName,
        materialId: item.materialId ?? null,
        items: [item],
      };
      byKey.set(key, created);
      result.push(created);
    }

    return result;
  }, [review, sortedItems]);

  const [pdfAvailability, setPdfAvailability] = useState<Record<string, PdfAvailability>>({});

  useEffect(() => {
    if (!review) {
      setPdfAvailability({});
      return;
    }

    let cancelled = false;

    const run = async () => {
      const next: Record<string, PdfAvailability> = {};
      for (const block of blocks) {
        const materialId = block.materialId;
        if (!materialId) {
          next[block.key] = { QUESTION: false, ANSWER: false };
          continue;
        }

        next[block.key] = await resolveBlockPdfAvailability(block, review.subject);
      }

      if (cancelled) return;
      setPdfAvailability(next);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [review, blocks]);

  const complete = useCallback(async () => {
    if (!review) return;
    await completeExam(review.examId);
    toast.success('復習テストを完了しました');
  }, [review, completeExam]);

  const previewMaterialPdf = useCallback(async (materialId: string, fileType: MaterialFile['fileType']) => {
    try {
      const files = await MATERIAL_API.listMaterialFiles(materialId);
      const target = pickLatestPdf(files, fileType);
      if (!target) {
        toast.error('PDFが見つかりません');
        return;
      }

      const url = await getMaterialFileDownloadUrl(materialId, target.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('PDFの取得に失敗しました');
    }
  }, []);

  return {
    review,
    isLoading,
    error,
    basePath,
    remove,
    ConfirmDialog,
    blocks,
    pdfAvailability,
    previewMaterialPdf,
    complete,
  };
};
