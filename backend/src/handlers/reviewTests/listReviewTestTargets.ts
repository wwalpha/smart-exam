import { ReviewTestRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import { REVIEW_MODE } from '@smart-exam/api-types';
import type { ListReviewTestTargetsResponse, ReviewMode, SubjectId } from '@smart-exam/api-types';

type ListReviewTestTargetsQuery = {
  mode?: ReviewMode;
  from?: string;
  to?: string;
  subject?: string;
};

export const listReviewTestTargets: AsyncHandler<{}, ListReviewTestTargetsResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const q = req.query as unknown as ListReviewTestTargetsQuery;
  if (!q.mode || !q.from || !q.to) {
    res.status(400).json({ items: [] });
    return;
  }

  if (q.mode !== REVIEW_MODE.QUESTION && q.mode !== REVIEW_MODE.KANJI) {
    res.status(400).json({ items: [] });
    return;
  }

  // createdDate(YYYY-MM-DD) の単純比較なので、YYYY-MM-DD 形式を前提とする
  const ymdRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!ymdRe.test(q.from) || !ymdRe.test(q.to)) {
    res.status(400).json({ items: [] });
    return;
  }

  const items = await ReviewTestRepository.listReviewTestTargets({
    mode: q.mode,
    fromYmd: q.from,
    toYmd: q.to,
    subject: typeof q.subject === 'string' ? (q.subject as SubjectId) : undefined,
  });

  res.json({ items });
};
