import { ReviewTestRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { SearchReviewTestsRequest, SearchReviewTestsResponse } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';

const SubjectIdSchema = z.enum(['1', '2', '3', '4']);
const ReviewModeSchema = z.enum(['QUESTION', 'KANJI']);

export const SearchReviewTestsBodySchema = z.object({
  subject: z.union([z.literal('ALL'), SubjectIdSchema]),
  mode: ReviewModeSchema,
  status: z.union([z.literal('ALL'), z.literal('IN_PROGRESS'), z.literal('COMPLETED')]).optional(),
  limit: z.number().int().positive().optional(),
  cursor: z.string().optional(),
});

export const searchReviewTests: AsyncHandler<
  {},
  SearchReviewTestsResponse,
  SearchReviewTestsRequest,
  ParsedQs
> = async (req, res) => {
  const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchReviewTestsBodySchema>;

  const items = await ReviewTestRepository.listReviewTests();
  const filtered = items.filter((x) => {
    if (x.mode !== body.mode) return false;
    if (body.subject !== 'ALL' && x.subject !== body.subject) return false;
    if (body.status && body.status !== 'ALL' && x.status !== body.status) return false;
    return true;
  });

  res.json({ items: filtered, total: filtered.length });
};
