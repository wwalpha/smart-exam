import type { ReviewAttempt } from '@smart-exam/api-types';
import type { ReviewTestItemEmbedded, ReviewTestTable } from '@/types/db';
import { ReviewTestsService } from '@/services';

const toAttemptedAt = (dateYmd: string): string => `${dateYmd}T00:00:00.000Z`;

const getAttemptFromTest = (params: {
  test: ReviewTestTable;
  match: (item: ReviewTestItemEmbedded) => boolean;
}): ReviewAttempt | null => {
  const { test, match } = params;
  const dateYmd = test.submittedDate ?? test.createdDate;

  const matched = (test.items ?? []).find((x) => match(x));
  if (!matched) return null;
  if (typeof matched.isCorrect !== 'boolean') return null;

  return {
    targetType: matched.targetType,
    targetId: matched.targetId,
    subject: test.subject,
    dateYmd,
    attemptedAt: toAttemptedAt(dateYmd),
    isCorrect: matched.isCorrect,
    reviewTestId: test.testId,
  };
};

export const listReviewAttempts = async (params: {
  targetType: 'QUESTION' | 'KANJI';
  targetId: string;
  subject?: string;
}): Promise<ReviewAttempt[]> => {
  const items: ReviewTestTable[] = await ReviewTestsService.scanAll();

  const filtered = items
    .filter((t) => {
      if (params.subject && t.subject !== (params.subject as any)) return false;
      if (!t.items || t.items.length === 0) return false;
      return true;
    })
    .map((test) =>
      getAttemptFromTest({
        test,
        match: (item) => item.targetType === params.targetType && item.targetId === params.targetId,
      })
    )
    .filter((x): x is ReviewAttempt => Boolean(x));

  // stable ordering: date desc then testId desc
  filtered.sort((a, b) => {
    if (a.dateYmd !== b.dateYmd) return a.dateYmd < b.dateYmd ? 1 : -1;
    if ((a.reviewTestId ?? '') !== (b.reviewTestId ?? '')) return (a.reviewTestId ?? '') < (b.reviewTestId ?? '') ? 1 : -1;
    return a.attemptedAt < b.attemptedAt ? 1 : -1;
  });

  return filtered;
};
