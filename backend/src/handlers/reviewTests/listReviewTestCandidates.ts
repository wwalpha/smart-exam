import { ReviewTestRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import { REVIEW_MODE } from '@smart-exam/api-types';
import type { ListReviewTestCandidatesResponse, ReviewMode, SubjectId } from '@smart-exam/api-types';

type ListReviewTestCandidatesQuery = {
  subject?: string;
  mode?: ReviewMode;
};

export const listReviewTestCandidates: AsyncHandler<{}, ListReviewTestCandidatesResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const q = req.query as unknown as ListReviewTestCandidatesQuery;

  if (q.mode && q.mode !== REVIEW_MODE.QUESTION && q.mode !== REVIEW_MODE.KANJI) {
    res.status(400).json({ items: [] });
    return;
  }

  const items = await ReviewTestRepository.listReviewTestCandidates({
    subject: typeof q.subject === 'string' ? (q.subject as SubjectId) : undefined,
    mode: q.mode,
  });

  res.json({
    items: items.map((x) => ({
      id: x.id,
      subject: x.subject,
      targetId: x.questionId,
      mode: x.mode,
      correctCount: typeof x.correctCount === 'number' ? x.correctCount : 0,
      nextTime: x.nextTime,
      testId: x.testId,
    })),
  });
};
