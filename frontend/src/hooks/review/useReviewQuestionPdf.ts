import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import { apiRequest } from '@/services/apiClient';

const BASE_PATH = '/exam/questions';

export const useReviewQuestionPdf = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { detail: currentTest, status } = useWordTestStore((s) => s.review);
  const fetchExam = useWordTestStore((s) => s.fetchExam);

  useEffect(() => {
    if (!id) return;
    if (currentTest?.examId === id) return;
    fetchExam(id, 'MATERIAL');
  }, [id, fetchExam, currentTest?.examId]);

  const pdfApiPath = currentTest?.pdf?.url ?? (id ? `/api/exam/question/${id}/pdf` : '');

  const [presignedUrl, setPresignedUrl] = useState<string>('');
  const [isFetchingPdfUrl, setIsFetchingPdfUrl] = useState(false);
  const [pdfUrlError, setPdfUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfApiPath) {
      setPresignedUrl('');
      setPdfUrlError(null);
      return;
    }

    let aborted = false;

    const run = async () => {
      try {
        setIsFetchingPdfUrl(true);
        setPdfUrlError(null);
        const res = await apiRequest<{ url: string }>({ method: 'GET', path: pdfApiPath });
        if (aborted) return;
        setPresignedUrl(res.url);
      } catch {
        if (aborted) return;
        setPresignedUrl('');
        setPdfUrlError('PDFの取得に失敗しました');
      } finally {
        if (!aborted) setIsFetchingPdfUrl(false);
      }
    };

    void run();
    return () => {
      aborted = true;
    };
  }, [pdfApiPath]);

  return {
    id,
    review: currentTest,
    isLoading: status.isLoading,
    error: status.error,
    basePath: BASE_PATH,
    pdfApiPath,
    presignedUrl,
    isFetchingPdfUrl,
    pdfUrlError,
    navigate,
  };
};
