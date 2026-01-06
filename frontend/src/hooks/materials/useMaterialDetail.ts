import { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import { apiRequestBlob } from '@/services/apiClient';
import { toast } from 'sonner';
import type { MaterialFile } from '@smart-exam/api-types';

const isPdfBlob = async (blob: Blob): Promise<boolean> => {
  const prefix = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...prefix) === '%PDF-';
};

const fileTypeOrder: Record<string, number> = {
  QUESTION: 1,
  ANSWER: 2,
  GRADED_ANSWER: 3,
};

type MaterialPdfFileType = 'QUESTION' | 'ANSWER' | 'GRADED_ANSWER';

const PDF_FILE_TYPES: MaterialPdfFileType[] = ['QUESTION', 'ANSWER', 'GRADED_ANSWER'];

const toMs = (iso: string | undefined): number => {
  if (!iso) return 0;
  const v = new Date(iso).getTime();
  return Number.isFinite(v) ? v : 0;
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
  const uploadMaterialPdf = useWordTestStore((s) => s.uploadMaterialPdf);

  useEffect(() => {
    if (id) {
      fetchMaterialSet(id);
      fetchMaterialFiles(id);
    }
  }, [id, fetchMaterialSet, fetchMaterialFiles]);

  const latestFilesByType = useMemo(() => {
    const byType: Partial<Record<MaterialPdfFileType, MaterialFile>> = {};

    for (const file of files) {
      if (!PDF_FILE_TYPES.includes(file.fileType as MaterialPdfFileType)) continue;
      const t = file.fileType as MaterialPdfFileType;
      const current = byType[t];
      if (!current) {
        byType[t] = file;
        continue;
      }
      if (toMs(file.createdAt) >= toMs(current.createdAt)) {
        byType[t] = file;
      }
    }

    return byType;
  }, [files]);

  const orderedFiles = useMemo(() => {
    const list = PDF_FILE_TYPES.map((t) => latestFilesByType[t]).filter((x): x is MaterialFile => !!x);
    return [...list].sort((a, b) => {
      const ao = fileTypeOrder[a.fileType] ?? 99;
      const bo = fileTypeOrder[b.fileType] ?? 99;
      if (ao !== bo) return ao - bo;
      return a.filename.localeCompare(b.filename);
    });
  }, [latestFilesByType]);

  const previewFile = useCallback(async (fileId: string) => {
    try {
      if (!id) return;
      const blob = await apiRequestBlob({
        method: 'GET',
        path: `/api/materials/${encodeURIComponent(id)}/files/${encodeURIComponent(fileId)}`,
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
  }, [id]);

  const replacePdf = useCallback(
    async (fileType: MaterialPdfFileType, file: File) => {
      if (!id) return;
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        toast.error('PDFのみアップロードできます');
        return;
      }

      try {
        await uploadMaterialPdf({ materialSetId: id, fileType, file });
        toast.success('アップロードしました');
      } catch {
        // store側でエラートーストを出す可能性があるため、ここでは追加表示しない
      }
    },
    [id, uploadMaterialPdf]
  );

  return {
    material: detail,
    files: orderedFiles,
    filesByType: latestFilesByType,
    isLoading: status.isLoading,
    error: status.error,
    id,
    fileTypeLabel,
    previewFile,
    replacePdf,
  };
};
