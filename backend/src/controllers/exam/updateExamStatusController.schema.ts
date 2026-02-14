import { z } from 'zod';

/** UpdateExamStatusBodySchema validates input shape. */
export const UpdateExamStatusBodySchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED']),
});
