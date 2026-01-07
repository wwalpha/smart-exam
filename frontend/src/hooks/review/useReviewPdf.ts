import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWordTestStore } from '@/stores';

export const useReviewPdf = (params: { basePath: string; isKanji: boolean }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isKanji = params.isKanji;
  const basePath = params.basePath;

  const { detail: currentTest, status } = useWordTestStore((s) => s.review);
  const fetchReviewTest = useWordTestStore((s) => s.fetchReviewTest);

  useEffect(() => {
    if (!id) return;

    // 既に同一IDの詳細を保持している場合は再取得しない（PDF遷移時の無駄な呼び出し防止）
    if (currentTest?.id === id || currentTest?.testId === id) return;
    fetchReviewTest(id);
  }, [id, fetchReviewTest, currentTest?.id, currentTest?.testId]);

  const pdfUrl = currentTest?.pdf?.url ?? (id ? `/api/review-tests/${id}/pdf` : '');

  return {
    id,
    review: currentTest,
    isLoading: status.isLoading,
    error: status.error,
    isKanji,
    basePath,
    pdfUrl,
    navigate,
  };
};
