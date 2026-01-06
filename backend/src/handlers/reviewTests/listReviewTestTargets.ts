import { ReviewTestRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import { REVIEW_MODE } from '@smart-exam/api-types';
import type { ListReviewTestTargetsResponse, SubjectId } from '@smart-exam/api-types';
import { DateUtils } from '@/lib/dateUtils';
import { z } from 'zod';
import type { ValidatedQuery } from '@/types/express';

const ReviewModeSchema = z.enum([REVIEW_MODE.QUESTION, REVIEW_MODE.KANJI]);
const SubjectIdSchema = z.enum(['1', '2', '3', '4']);

const queryString = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string());
const queryStringOptional = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

export const ListReviewTestTargetsQuerySchema = z.object({
  mode: queryString().pipe(ReviewModeSchema),
  from: queryString().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  to: queryString().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
});

export const listReviewTestTargets: AsyncHandler<{}, ListReviewTestTargetsResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const q = (req.validated?.query ?? req.query) as ValidatedQuery<typeof ListReviewTestTargetsQuerySchema>;

  const items = await ReviewTestRepository.listReviewTestTargets({
    mode: q.mode,
    fromYmd: q.from,
    toYmd: q.to,
    subject: q.subject as SubjectId | undefined,
  });

  res.json({ items });
};
