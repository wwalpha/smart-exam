import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import { buildApiUrl } from '@/services/apiClient';
import { toast } from 'sonner';
import type { MaterialFile } from '@smart-exam/api-types';
import { MATERIAL_PDF_FILE_TYPE_LABEL, MATERIAL_PDF_FILE_TYPES, type MaterialPdfFileType } from '@/lib/materialConsts';

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

const isValidYmd = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
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
  const [isUpdatingRegisteredDate, setIsUpdatingRegisteredDate] = useState<boolean>(false);

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

  const onRegisteredDateInputChange = useCallback((nextRegisteredDate: string) => {
    setRegisteredDate(nextRegisteredDate);
  }, []);

  const commitRegisteredDate = useCallback(() => {
    const nextRegisteredDate = registeredDate;

    // 不正な日付は更新対象にしない
    if (!isValidYmd(nextRegisteredDate)) {
      return;
    }

    // 既存値と同じ日付は更新不要
    if (!id || !detail || detail.registeredDate === nextRegisteredDate) {
      return;
    }

    void (async () => {
      setIsUpdatingRegisteredDate(true);
      try {
        await updateMaterial(id, { registeredDate: nextRegisteredDate });
        await fetchMaterial(id);
      } catch {
        // store側でエラー表示されるため二重表示しない
      } finally {
        setIsUpdatingRegisteredDate(false);
      }
    })();
  }, [registeredDate, id, detail, updateMaterial, fetchMaterial]);

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

  const previewFile = useCallback(
    (fileId: string) => {
      // IDが不正な状態ではプレビューできない
      if (!id) return;
      // S3 へのリダイレクトをXHRで辿るとCORS制約にかかるため、ブラウザ遷移で直接開く
      const url = buildApiUrl(`/api/materials/${encodeURIComponent(id)}/files/${encodeURIComponent(fileId)}`);
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [id],
  );

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
    [id, uploadMaterialPdf],
  );

  return {
    material: detail,
    files: orderedFiles,
    filesByType: latestFilesByType,
    isInitialLoading: status.isLoading && !detail,
    isBusy: status.isLoading,
    isUpdatingRegisteredDate,
    error: status.error,
    id,
    fileTypeLabel,
    previewFile,
    replacePdf,
    registeredDate,
    onRegisteredDateInputChange,
    commitRegisteredDate,
    complete,
    canComplete,
  };
};
