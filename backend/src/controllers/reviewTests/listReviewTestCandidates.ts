import { ReviewTestRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import { REVIEW_MODE } from '@smart-exam/api-types';
import type { ListReviewTestCandidatesResponse, ReviewMode, SubjectId } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedQuery } from '@/types/express';
import { SubjectIdSchema } from '@/lib/zodSchemas';

const ReviewModeSchema = z.enum([REVIEW_MODE.QUESTION, REVIEW_MODE.KANJI]);

const queryStringOptional = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

export const ListReviewTestCandidatesQuerySchema = z.object({
  subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
  mode: queryStringOptional().pipe(ReviewModeSchema.optional()),
});

export const listReviewTestCandidates: AsyncHandler<{}, ListReviewTestCandidatesResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const q = (req.validated?.query ?? req.query) as ValidatedQuery<typeof ListReviewTestCandidatesQuerySchema>;

  const items = await ReviewTestRepository.listReviewTestCandidates({
    subject: q.subject as SubjectId | undefined,
    mode: q.mode as ReviewMode | undefined,
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
