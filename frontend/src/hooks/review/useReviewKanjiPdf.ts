import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';

const BASE_PATH = '/reviewtests/kanji';

export const useReviewKanjiPdf = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { detail: currentTest, status } = useWordTestStore((s) => s.review);
  const fetchReviewTest = useWordTestStore((s) => s.fetchReviewTest);

  useEffect(() => {
    if (!id) return;
    if (currentTest?.id === id || currentTest?.testId === id) return;
    fetchReviewTest(id);
  }, [id, fetchReviewTest, currentTest?.id, currentTest?.testId]);

  const pdfUrl = currentTest?.pdf?.url ?? (id ? `/api/review-tests/${id}/pdf` : '');

  return {
    id,
    review: currentTest,
    isLoading: status.isLoading,
    error: status.error,
    basePath: BASE_PATH,
    pdfUrl,
    navigate,
  };
};
