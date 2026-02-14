import { z } from 'zod';

import { REVIEW_MODE } from '@smart-exam/api-types';

import { SubjectIdSchema } from '@/lib/zodSchemas';

const ReviewModeSchema = z.enum([REVIEW_MODE.QUESTION, REVIEW_MODE.KANJI]);

const PositiveIntFromUnknownSchema = z.preprocess((v) => {
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed.length === 0) return v;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, z.number().int().positive());

const BooleanFromUnknownSchema = z.preprocess((v) => {
  if (typeof v === 'string') {
    const trimmed = v.trim().toLowerCase();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
  }
  return v;
}, z.boolean());

/** CreateReviewTestBodySchema validates input shape. */
export const CreateReviewTestBodySchema = z.object({
  subject: SubjectIdSchema,
  count: PositiveIntFromUnknownSchema,
  mode: ReviewModeSchema,
  days: PositiveIntFromUnknownSchema.optional(),
  rangeFrom: z.string().optional(),
  rangeTo: z.string().optional(),
  includeCorrect: BooleanFromUnknownSchema.optional(),
});
