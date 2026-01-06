import { useCallback, useMemo, useState } from 'react';
import { useWordTestStore } from '@/stores';
import type { Question } from '@smart-exam/api-types';
import type { SubjectId } from '@smart-exam/api-types';

export const useQuestionAttemptHistory = (params: {
  subject: SubjectId | null;
  questions: Question[];
}) => {
  const { items, status } = useWordTestStore((s) => s.reviewAttempts);
  const fetchReviewAttempts = useWordTestStore((s) => s.fetchReviewAttempts);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  const selectedQuestion = useMemo(() => {
    if (!selectedQuestionId) return null;
    return params.questions.find((q) => q.id === selectedQuestionId) ?? null;
  }, [params.questions, selectedQuestionId]);

  const openForQuestion = useCallback(
    async (questionId: string) => {
      setSelectedQuestionId(questionId);
      setIsOpen(true);

      if (!params.subject) return;
      await fetchReviewAttempts({
        targetType: 'QUESTION',
        targetId: questionId,
        subject: params.subject,
      });
    },
    [fetchReviewAttempts, params.subject]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedQuestionId(null);
  }, []);

  return {
    isOpen,
    selectedQuestion,
    attempts: items,
    isLoading: status.isLoading,
    error: status.error,
    openForQuestion,
    close,
    setIsOpen,
  };
};
