import { useEffect, useMemo } from 'react';
import { useWordTestStore } from '@/stores';
import type { ReviewMode, ReviewTestCandidate } from '@smart-exam/api-types';
import type { SubjectId } from '@smart-exam/api-types';

export const useReviewCandidateForTarget = (params: {
  mode: ReviewMode;
  targetId: string | null;
  subject?: SubjectId | null;
  enabled: boolean;
}) => {
  const { items, status } = useWordTestStore((s) => s.reviewCandidates);
  const fetchReviewTestCandidates = useWordTestStore((s) => s.fetchReviewTestCandidates);

  useEffect(() => {
    if (!params.enabled) return;
    void fetchReviewTestCandidates({
      mode: params.mode,
      subject: params.subject ?? undefined,
    });
  }, [params.enabled, params.mode, params.subject, fetchReviewTestCandidates]);

  const candidate = useMemo<ReviewTestCandidate | null>(() => {
    if (!params.targetId) return null;
    return (
      items.find((x) => {
        if (x.mode !== params.mode) return false;
        if (params.subject && x.subject !== params.subject) return false;
        return x.targetId === params.targetId;
      }) ?? null
    );
  }, [items, params.mode, params.subject, params.targetId]);

  return {
    candidate,
    isLoading: status.isLoading,
    error: status.error,
  };
};
