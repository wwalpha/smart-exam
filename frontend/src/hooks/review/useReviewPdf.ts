import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWordTestStore } from '@/stores';

export const useReviewPdf = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isKanji = location.pathname.includes('/kanji');
  const basePath = isKanji ? '/reviewtests/kanji' : '/reviewtests/questions';

  const { detail: currentTest, status } = useWordTestStore((s) => s.review);
  const fetchReviewTest = useWordTestStore((s) => s.fetchReviewTest);

  useEffect(() => {
    if (id) {
      fetchReviewTest(id);
    }
  }, [id, fetchReviewTest]);

  const pdfUrl = id ? `/api/review-tests/${id}/pdf` : '';

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
