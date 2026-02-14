import { z } from 'zod';

import { REVIEW_MODE } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { SubjectIdSchema } from '@/lib/zodSchemas';

const ReviewModeSchema = z.enum([REVIEW_MODE.QUESTION, REVIEW_MODE.KANJI]);

const queryString = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string());
const queryStringOptional = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

/** ListReviewTestTargetsQuerySchema validates query string. */
export const ListReviewTestTargetsQuerySchema = z.object({
  mode: queryString().pipe(ReviewModeSchema),
  from: queryString().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  to: queryString().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
});
