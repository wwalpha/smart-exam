import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import { compareQuestionNumber } from '@/utils/questionNumber';

export const useQuestionAttemptHistoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialQuestionId = searchParams.get('questionId');

  const { detail: material, questions, status } = useWordTestStore((s) => s.material);
  const fetchMaterial = useWordTestStore((s) => s.fetchMaterial);
  const fetchQuestions = useWordTestStore((s) => s.fetchQuestions);

  useEffect(() => {
    if (!id) return;
    void fetchMaterial(id);
    void fetchQuestions(id);
  }, [id, fetchMaterial, fetchQuestions]);

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => compareQuestionNumber(a.canonicalKey, b.canonicalKey));
  }, [questions]);

  return {
    materialId: id ?? null,
    material,
    sortedQuestions,
    status,
    initialQuestionId,
  };
};
