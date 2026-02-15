import { z } from 'zod';

import { EXAM_MODE } from '@smart-exam/api-types';

import { SubjectIdSchema } from '@/lib/zodSchemas';

const ReviewModeSchema = z.enum([EXAM_MODE.QUESTION, EXAM_MODE.KANJI]);

const queryString = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string());
const queryStringOptional = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

/** ListReviewAttemptsQuerySchema validates query string. */
export const ListReviewAttemptsQuerySchema = z.object({
  targetType: queryString().pipe(ReviewModeSchema),
  targetId: queryString().pipe(z.string().min(1)),
  subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
});
