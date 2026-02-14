import { z } from 'zod';

/** UpdateReviewTestStatusBodySchema validates input shape. */
export const UpdateReviewTestStatusBodySchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED']),
});
