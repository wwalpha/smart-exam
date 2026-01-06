import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import { ReviewTestRepository } from '@/repositories';
import { REVIEW_MODE } from '@smart-exam/api-types';
import type { ListReviewAttemptsResponse, ReviewTargetType, SubjectId } from '@smart-exam/api-types';

type ListReviewAttemptsQuery = {
  targetType?: string;
  targetId?: string;
  subject?: string;
};

export const listReviewAttempts: AsyncHandler<
  {},
  ListReviewAttemptsResponse | { error: string },
  {},
  ParsedQs
> = async (req, res) => {
  const q = req.query as unknown as ListReviewAttemptsQuery;

  const targetTypeRaw = q.targetType;
  const targetId = q.targetId;

  if ((targetTypeRaw !== REVIEW_MODE.QUESTION && targetTypeRaw !== REVIEW_MODE.KANJI) || !targetId) {
    res.status(400).json({ error: 'Bad Request' });
    return;
  }

  const items = await ReviewTestRepository.listReviewAttempts({
    targetType: targetTypeRaw as ReviewTargetType,
    targetId,
    subject: typeof q.subject === 'string' ? (q.subject as SubjectId) : undefined,
  });

  res.json({ items });
};
