import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import { ReviewTestRepository } from '@/repositories';
import { REVIEW_MODE } from '@smart-exam/api-types';
import type { ListReviewAttemptsResponse, ReviewTargetType, SubjectId } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedQuery } from '@/types/express';

const ReviewModeSchema = z.enum([REVIEW_MODE.QUESTION, REVIEW_MODE.KANJI]);
const SubjectIdSchema = z.enum(['1', '2', '3', '4']);

const queryString = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string());
const queryStringOptional = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

export const ListReviewAttemptsQuerySchema = z.object({
  targetType: queryString().pipe(ReviewModeSchema),
  targetId: queryString().pipe(z.string().min(1)),
  subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
});

export const listReviewAttempts: AsyncHandler<
  {},
  ListReviewAttemptsResponse | { error: string },
  {},
  ParsedQs
> = async (req, res) => {
  const q = (req.validated?.query ?? req.query) as ValidatedQuery<typeof ListReviewAttemptsQuerySchema>;

  const items = await ReviewTestRepository.listReviewAttempts({
    targetType: q.targetType as ReviewTargetType,
    targetId: q.targetId,
    subject: q.subject as SubjectId | undefined,
  });

  res.json({ items });
};
