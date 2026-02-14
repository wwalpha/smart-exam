import { z } from 'zod';

import { REVIEW_MODE } from '@smart-exam/api-types';

import { SubjectIdSchema } from '@/lib/zodSchemas';

const ReviewModeSchema = z.enum([REVIEW_MODE.QUESTION, REVIEW_MODE.KANJI]);

/** CreateReviewTestBodySchema validates input shape. */
export const CreateReviewTestBodySchema = z.object({
  subject: SubjectIdSchema,
  count: z.number().int().positive(),
  mode: ReviewModeSchema,
  days: z.number().int().positive().optional(),
  rangeFrom: z.string().optional(),
  rangeTo: z.string().optional(),
  includeCorrect: z.boolean().optional(),
});
