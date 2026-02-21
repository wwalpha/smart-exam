import { z } from 'zod';

import { EXAM_MODE } from '@smart-exam/api-types';

import { SubjectIdSchema } from '@/lib/zodSchemas';

const ReviewModeSchema = z.enum([EXAM_MODE.MATERIAL, EXAM_MODE.KANJI]);

const queryString = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string());
const queryStringOptional = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

/** ListExamAttemptsQuerySchema validates query string. */
export const ListExamAttemptsQuerySchema = z.object({
  targetType: queryString().pipe(ReviewModeSchema),
  targetId: queryString().pipe(z.string().min(1)),
  subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
});
