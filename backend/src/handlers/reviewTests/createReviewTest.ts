import { ReviewTestRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { CreateReviewTestRequest, CreateReviewTestResponse } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';

const SubjectIdSchema = z.enum(['1', '2', '3', '4']);
const ReviewModeSchema = z.enum(['QUESTION', 'KANJI']);

export const CreateReviewTestBodySchema = z.object({
  subject: SubjectIdSchema,
  count: z.number().int().positive(),
  mode: ReviewModeSchema,
  days: z.number().int().positive().optional(),
  rangeFrom: z.string().optional(),
  rangeTo: z.string().optional(),
  includeCorrect: z.boolean().optional(),
});

export const createReviewTest: AsyncHandler<{}, CreateReviewTestResponse, CreateReviewTestRequest, ParsedQs> = async (
  req,
  res
) => {
  const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateReviewTestBodySchema>;
  const item = await ReviewTestRepository.createReviewTest(body);
  res.status(201).json(item);
};
