import { z } from 'zod';

import { SubjectIdSchema } from '@/lib/zodSchemas';
import { BooleanFromUnknownSchema } from '@/lib/zodSchemas';

/** CreateQuestionBodySchema validates input shape. */
export const CreateQuestionBodySchema = z.object({
  canonicalKey: z.string().min(1),
  subject: SubjectIdSchema,
  tags: z.array(z.string().min(1)).optional(),
});

/** CreateQuestionsBulkBodySchema validates bulk input shape. */
export const CreateQuestionsBulkBodySchema = z.object({
  items: z.array(CreateQuestionBodySchema).min(1),
});

/** UpdateQuestionBodySchema validates input shape. */
export const UpdateQuestionBodySchema = z.object({
  canonicalKey: z.string().min(1).optional(),
  subject: SubjectIdSchema.optional(),
  tags: z.array(z.string().min(1)).optional(),
});

/** SetMaterialChoicesBodySchema validates input shape. */
export const SetMaterialChoicesBodySchema = z.object({
  items: z.array(
    z.object({
      questionId: z.string().min(1),
      isCorrect: BooleanFromUnknownSchema,
      correctAnswer: z.string().trim().optional(),
    }),
  ),
});
