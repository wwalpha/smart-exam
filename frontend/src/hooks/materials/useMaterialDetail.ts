import { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import { apiRequestBlob } from '@/services/apiClient';
import { toast } from 'sonner';

const isPdfBlob = async (blob: Blob): Promise<boolean> => {
  const prefix = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...prefix) === '%PDF-';
};

const fileTypeOrder: Record<string, number> = {
  QUESTION: 1,
  ANSWER: 2,
  GRADED_ANSWER: 3,
};

const fileTypeLabel = (fileType: string): string => {
  if (fileType === 'QUESTION') return '問題用紙';
  if (fileType === 'ANSWER') return '解答用紙';
  if (fileType === 'GRADED_ANSWER') return '答案用紙';
  return fileType;
};

export const useMaterialDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { detail, files, status } = useWordTestStore((s) => s.material);
  const fetchMaterialSet = useWordTestStore((s) => s.fetchMaterialSet);
  const fetchMaterialFiles = useWordTestStore((s) => s.fetchMaterialFiles);

  useEffect(() => {
    if (id) {
      fetchMaterialSet(id);
      fetchMaterialFiles(id);
    }
  }, [id, fetchMaterialSet, fetchMaterialFiles]);

  const orderedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      const ao = fileTypeOrder[a.fileType] ?? 99;
      const bo = fileTypeOrder[b.fileType] ?? 99;
      if (ao !== bo) return ao - bo;
      return a.filename.localeCompare(b.filename);
    });
  }, [files]);

  const previewFile = useCallback(async (key: string) => {
    try {
      const blob = await apiRequestBlob({
        method: 'GET',
        path: `/api/material-files?key=${encodeURIComponent(key)}`,
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
    material: detail,
    files: orderedFiles,
    isLoading: status.isLoading,
    error: status.error,
    id,
    fileTypeLabel,
    previewFile,
  };
};
