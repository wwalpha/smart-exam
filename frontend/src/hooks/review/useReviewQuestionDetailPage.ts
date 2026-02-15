import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { MaterialFile } from '@smart-exam/api-types';
import { apiRequestBlob } from '@/services/apiClient';
import * as MATERIAL_API from '@/services/materialApi';
import { useReviewQuestionDetail } from './useReviewQuestionDetail';

type PdfAvailability = {
  QUESTION: boolean;
  ANSWER: boolean;
};

const isPdfBlob = async (blob: Blob): Promise<boolean> => {
  const prefix = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...prefix) === '%PDF-';
};

const pickLatestPdf = (files: MaterialFile[], fileType: MaterialFile['fileType']): MaterialFile | null => {
  const candidates = files.filter((f) => f.fileType === fileType);
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
};

export const useReviewQuestionDetailPage = () => {
  const { review, isLoading, error, basePath, remove, updateExamStatus, ConfirmDialog } =
    useReviewQuestionDetail();
  const navigate = useNavigate();

  const blocks = useMemo(() => {
    if (!review) return [];

    const entries = review.items;
    const result: Array<{
      key: string;
      grade: string;
      provider: string;
      materialDate: string;
      materialName: string;
      materialId: string | null;
      items: typeof entries;
    }> = [];
    const byKey = new Map<string, (typeof result)[number]>();

    for (const item of entries) {
      const grade = item.grade ?? '';
      const provider = item.provider ?? '';
      const materialDate = item.materialDate ?? '';
      const materialName = item.materialName ?? '';
      const key = [grade, provider, materialDate, materialName].join('||');

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
  }, [review]);

  const [pdfAvailability, setPdfAvailability] = useState<Record<string, PdfAvailability>>({});

  useEffect(() => {
    if (!review) return;

    let cancelled = false;

    const uniqueMaterialIds = Array.from(
      new Set(blocks.map((b) => b.materialId).filter((x): x is string => typeof x === 'string' && x.length > 0)),
    );

    const run = async () => {
      const next: Record<string, PdfAvailability> = {};
      for (const materialId of uniqueMaterialIds) {
        try {
          const files = await MATERIAL_API.listMaterialFiles(materialId);
          next[materialId] = {
            QUESTION: files.some((f) => f.fileType === 'QUESTION'),
            ANSWER: files.some((f) => f.fileType === 'ANSWER'),
          };
        } catch {
          next[materialId] = { QUESTION: false, ANSWER: false };
        }
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
    await updateExamStatus(review.examId, { status: 'COMPLETED' }, 'QUESTION');
    navigate(basePath);
  }, [review, updateExamStatus, navigate, basePath]);

  const previewMaterialPdf = useCallback(async (materialId: string, fileType: MaterialFile['fileType']) => {
    try {
      const files = await MATERIAL_API.listMaterialFiles(materialId);
      const target = pickLatestPdf(files, fileType);
      if (!target) {
        toast.error('PDFが見つかりません');
        return;
      }

      const blob = await apiRequestBlob({
        method: 'GET',
        path: `/api/materials/${encodeURIComponent(materialId)}/files/${encodeURIComponent(target.id)}`,
      });

      if (!(await isPdfBlob(blob))) {
        const text = await blob.text().catch(() => '');
        toast.error('PDFの取得に失敗しました', { description: text.slice(0, 200) });
        return;
      }

      const pdfBlob = blob.slice(0, blob.size, 'application/pdf');
      const url = URL.createObjectURL(pdfBlob);
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
