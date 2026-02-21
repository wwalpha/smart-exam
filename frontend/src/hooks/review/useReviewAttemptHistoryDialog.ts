import { useCallback, useState } from 'react';
import { useWordTestStore } from '@/stores';
import type { SubjectId } from '@smart-exam/api-types';

export const useReviewAttemptHistoryDialog = () => {
  const { items, status } = useWordTestStore((s) => s.reviewAttempts);
  const fetchReviewAttempts = useWordTestStore((s) => s.fetchReviewAttempts);

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<{
    targetId: string;
    subject: SubjectId;
    title: string;
  } | null>(null);

  const open = useCallback(
    async (params: { targetId: string; subject: SubjectId; title: string }) => {
      setSelected(params);
      setIsOpen(true);
      await fetchReviewAttempts({
        targetType: 'MATERIAL',
        targetId: params.targetId,
        subject: params.subject,
      });
    },
    [fetchReviewAttempts],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setSelected(null);
  }, []);

  return {
    isOpen,
    setIsOpen,
    selected,
    attempts: items,
    isLoading: status.isLoading,
    error: status.error,
    open,
    close,
  };
};
