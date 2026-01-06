import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import { ReviewTestRepository } from '@/repositories';
import type { ListReviewAttemptsResponse } from '@smart-exam/api-types';

type ListReviewAttemptsQuery = {
  targetType?: string;
  targetId?: string;
  subject?: string;
};

export const listReviewAttempts: AsyncHandler<{}, ListReviewAttemptsResponse | { error: string }, {}, ParsedQs> = async (
  req,
  res
) => {
  const q = req.query as unknown as ListReviewAttemptsQuery;

  const targetType = q.targetType;
  const targetId = q.targetId;

  if ((targetType !== 'QUESTION' && targetType !== 'KANJI') || !targetId) {
    res.status(400).json({ error: 'Bad Request' });
    return;
  }

  const items = await ReviewTestRepository.listReviewAttempts({
    targetType,
    targetId,
    subject: q.subject,
  });

  res.json({ items });
};
