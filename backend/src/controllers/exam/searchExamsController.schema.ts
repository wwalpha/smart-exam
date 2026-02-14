import { z } from 'zod';

import { REVIEW_MODE } from '@smart-exam/api-types';

import { SubjectIdSchema } from '@/lib/zodSchemas';

const ReviewModeSchema = z.enum([REVIEW_MODE.QUESTION, REVIEW_MODE.KANJI]);

/** SearchExamsBodySchema validates input shape. */
export const SearchExamsBodySchema = z.object({
  subject: z.union([z.literal('ALL'), SubjectIdSchema]),
  mode: ReviewModeSchema,
  status: z.union([z.literal('ALL'), z.literal('IN_PROGRESS'), z.literal('COMPLETED')]).optional(),
  limit: z.number().int().positive().optional(),
  cursor: z.string().optional(),
});
