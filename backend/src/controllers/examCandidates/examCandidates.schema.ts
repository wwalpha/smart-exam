import { z } from 'zod';

import { EXAM_MODE } from '@smart-exam/api-types';

import { SubjectIdSchema } from '@/lib/zodSchemas';

const ReviewModeSchema = z.enum([EXAM_MODE.MATERIAL, EXAM_MODE.KANJI]);

const queryStringOptional = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

export const ListExamCandidatesQuerySchema = z.object({
  subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
  mode: queryStringOptional().pipe(ReviewModeSchema.optional()),
});
