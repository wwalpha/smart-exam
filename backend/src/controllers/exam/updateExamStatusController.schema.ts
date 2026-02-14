import { z } from 'zod';

/** UpdateExamStatusParamsSchema validates path params. */
export const UpdateExamStatusParamsSchema = z.object({
  testId: z.string().min(1),
});

/** UpdateExamStatusBodySchema validates input shape. */
export const UpdateExamStatusBodySchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED']),
});
