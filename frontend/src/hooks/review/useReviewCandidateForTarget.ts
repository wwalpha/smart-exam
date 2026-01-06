import { useEffect, useMemo } from 'react';
import { useWordTestStore } from '@/stores';
import type { ReviewTestCandidate } from '@smart-exam/api-types';

export const useReviewCandidateForTarget = (params: {
  mode: 'QUESTION' | 'KANJI';
  targetId: string | null;
  subject?: string | null;
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
        if (params.subject && x.subject !== (params.subject as any)) return false;
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
