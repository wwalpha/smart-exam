import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import { apiRequestBlob } from '@/services/apiClient';
import { toast } from 'sonner';
import type { MaterialFile } from '@smart-exam/api-types';
import { MATERIAL_PDF_FILE_TYPE_LABEL, MATERIAL_PDF_FILE_TYPES, type MaterialPdfFileType } from '@/lib/materialConsts';

const isPdfBlob = async (blob: Blob): Promise<boolean> => {
  const prefix = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...prefix) === '%PDF-';
};

const fileTypeOrder: Record<string, number> = {
  QUESTION: 1,
  ANSWER: 2,
  GRADED_ANSWER: 3,
};


const toMs = (iso: string | undefined): number => {
  if (!iso) return 0;
  const v = new Date(iso).getTime();
  return Number.isFinite(v) ? v : 0;
};

const fileTypeLabel = (fileType: string): string => {
  // API側で想定外のfileTypeが返ってきても画面が壊れないように保険をかける
  if (fileType === 'QUESTION' || fileType === 'ANSWER' || fileType === 'GRADED_ANSWER') {
    return MATERIAL_PDF_FILE_TYPE_LABEL[fileType];
  }
  return fileType;
};

export const useMaterialDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { detail, files, questions, status } = useWordTestStore((s) => s.material);
  const fetchMaterial = useWordTestStore((s) => s.fetchMaterial);
  const fetchMaterialFiles = useWordTestStore((s) => s.fetchMaterialFiles);
  const fetchQuestions = useWordTestStore((s) => s.fetchQuestions);
  const uploadMaterialPdf = useWordTestStore((s) => s.uploadMaterialPdf);
  const updateMaterial = useWordTestStore((s) => s.updateMaterial);
  const completeMaterial = useWordTestStore((s) => s.completeMaterial);

  const [registeredDate, setRegisteredDate] = useState<string>('');

  useEffect(() => {
    // IDがある場合のみ取得（URLが不正なときに無駄なAPIを叩かない）
    if (id) {
      fetchMaterial(id);
      fetchMaterialFiles(id);
      fetchQuestions(id);
    }
  }, [id, fetchMaterial, fetchMaterialFiles, fetchQuestions]);

  useEffect(() => {
    if (!detail) return;
    setRegisteredDate(detail.registeredDate ?? '');
  }, [detail]);

  const latestFilesByType = useMemo(() => {
    const byType: Partial<Record<MaterialPdfFileType, MaterialFile>> = {};

    for (const file of files) {
      // QUESTION/ANSWER/GRADED_ANSWER 以外は一覧対象外
      if (!MATERIAL_PDF_FILE_TYPES.includes(file.fileType as MaterialPdfFileType)) continue;
      const t = file.fileType as MaterialPdfFileType;
      const current = byType[t];
      if (!current) {
        byType[t] = file;
        continue;
      }
      // 同じ種別は createdAt が新しいものを採用する
      if (toMs(file.createdAt) >= toMs(current.createdAt)) {
        byType[t] = file;
      }
    }

    return byType;
  }, [files]);

  const orderedFiles = useMemo(() => {
    const list = MATERIAL_PDF_FILE_TYPES.map((t) => latestFilesByType[t]).filter((x): x is MaterialFile => !!x);
    return [...list].sort((a, b) => {
      const ao = fileTypeOrder[a.fileType] ?? 99;
      const bo = fileTypeOrder[b.fileType] ?? 99;
      if (ao !== bo) return ao - bo;
      return a.filename.localeCompare(b.filename);
    });
  }, [latestFilesByType]);

  const saveRegisteredDate = useCallback(async () => {
    // IDが不正な状態では更新しない
    if (!id) return;
    try {
      await updateMaterial(id, { registeredDate });
      toast.success('更新しました');
    } catch {
      // store側でトーストを出す可能性があるため、ここでは追加表示しない
    }
  }, [id, registeredDate, updateMaterial]);

  const complete = useCallback(async () => {
    if (!id || !detail) return;
    if (detail.isCompleted) return;
    // 問題が0件の教材は完了できない
    if (questions.length === 0) return;
    try {
      await completeMaterial(id);
      toast.success('教材を完了にしました');
      await fetchMaterial(id);
    } catch {
      // store側でエラー表示されるため二重表示しない
    }
  }, [id, detail, questions.length, completeMaterial, fetchMaterial]);

  const canComplete = !!detail && !detail.isCompleted && questions.length > 0;

  const previewFile = useCallback(async (fileId: string) => {
    try {
      // IDが不正な状態ではプレビューできない
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
      // IDが不正な状態ではアップロードしない
      if (!id) return;
      // MIMEが不正でも拡張子で救済する（ブラウザ依存対策）
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        toast.error('PDFのみアップロードできます');
        return;
      }

      try {
        await uploadMaterialPdf({ materialId: id, fileType, file });
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
    isInitialLoading: status.isLoading && !detail,
    isBusy: status.isLoading,
    error: status.error,
    id,
    fileTypeLabel,
    previewFile,
    replacePdf,
    registeredDate,
    setRegisteredDate,
    saveRegisteredDate,
    complete,
    canComplete,
  };
};
