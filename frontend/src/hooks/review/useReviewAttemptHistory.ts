import { useEffect } from 'react';
import { useWordTestStore } from '@/stores';
import type { ReviewAttempt, ReviewTargetType } from '@smart-exam/api-types';

export const useReviewAttemptHistory = (params: {
  targetType: ReviewTargetType;
  targetId: string | null;
  subject?: string | null;
  enabled: boolean;
}) => {
  const { items, status } = useWordTestStore((s) => s.reviewAttempts);
  const fetchReviewAttempts = useWordTestStore((s) => s.fetchReviewAttempts);

  useEffect(() => {
    if (!params.enabled) return;
    if (!params.targetId) return;

    void fetchReviewAttempts({
      targetType: params.targetType,
      targetId: params.targetId,
      subject: params.subject ?? undefined,
    });
  }, [params.enabled, params.targetId, params.targetType, params.subject, fetchReviewAttempts]);

  return {
    attempts: items as ReviewAttempt[],
    isLoading: status.isLoading,
    error: status.error,
    refetch: async () => {
      if (!params.targetId) return;
      await fetchReviewAttempts({
        targetType: params.targetType,
        targetId: params.targetId,
        subject: params.subject ?? undefined,
      });
    },
  };
};
