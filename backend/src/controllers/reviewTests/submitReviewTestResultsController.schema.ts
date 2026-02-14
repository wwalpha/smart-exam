import { z } from 'zod';

/** SubmitReviewTestResultsBodySchema validates input shape. */
export const SubmitReviewTestResultsBodySchema = z.object({
  results: z.array(
    z.object({
      id: z.string().min(1),
      isCorrect: z.boolean(),
    }),
  ),
  date: z.string().optional(),
});
