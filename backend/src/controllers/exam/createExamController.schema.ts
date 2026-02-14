import { z } from 'zod';

import { REVIEW_MODE } from '@smart-exam/api-types';

import { PositiveIntFromUnknownSchema, SubjectIdSchema } from '@/lib/zodSchemas';

const ReviewModeSchema = z.enum([REVIEW_MODE.QUESTION, REVIEW_MODE.KANJI]);

/** CreateExamBodySchema validates input shape. */
export const CreateExamBodySchema = z.object({
  subject: SubjectIdSchema,
  count: PositiveIntFromUnknownSchema,
  mode: ReviewModeSchema,
});
