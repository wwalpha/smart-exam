import { z } from 'zod';

import { REVIEW_MODE } from '@smart-exam/api-types';

import { SubjectIdSchema } from '@/lib/zodSchemas';

const ReviewModeSchema = z.enum([REVIEW_MODE.QUESTION, REVIEW_MODE.KANJI]);

const queryStringOptional = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

export const ListReviewTestCandidatesQuerySchema = z.object({
  subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
  mode: queryStringOptional().pipe(ReviewModeSchema.optional()),
});
