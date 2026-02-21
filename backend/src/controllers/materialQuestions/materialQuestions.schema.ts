import { z } from 'zod';

import { SubjectIdSchema } from '@/lib/zodSchemas';
import { BooleanFromUnknownSchema } from '@/lib/zodSchemas';

/** SearchQuestionsBodySchema validates input shape. */
export const SearchQuestionsBodySchema = z.object({
  keyword: z.string().optional(),
  subject: SubjectIdSchema.optional(),
});

/** CreateQuestionBodySchema validates input shape. */
export const CreateQuestionBodySchema = z.object({
  canonicalKey: z.string().min(1),
  subject: SubjectIdSchema,
  tags: z.array(z.string().min(1)).optional(),
});

/** UpdateQuestionBodySchema validates input shape. */
export const UpdateQuestionBodySchema = z.object({
  canonicalKey: z.string().min(1).optional(),
  subject: SubjectIdSchema.optional(),
  tags: z.array(z.string().min(1)).optional(),
});

/** SetQuestionChoiceBodySchema validates input shape. */
export const SetQuestionChoiceBodySchema = z.object({
  isCorrect: BooleanFromUnknownSchema,
});
