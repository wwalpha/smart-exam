import { EXAM_MODE } from '@smart-exam/api-types';
import { z } from 'zod';

import { SubjectIdSchema } from '@/lib/zodSchemas';

export const CandidateSearchBodySchema = z.object({
  subject: SubjectIdSchema.optional(),
  mode: z.enum([EXAM_MODE.MATERIAL, EXAM_MODE.KANJI]).optional(),
});