import { z } from 'zod';

/** SubmitExamResultsParamsSchema validates path params. */
export const SubmitExamResultsParamsSchema = z.object({
  testId: z.string().min(1),
});

/** SubmitExamResultsBodySchema validates input shape. */
export const SubmitExamResultsBodySchema = z.object({
  results: z.array(
    z.object({
      id: z.string().min(1),
      isCorrect: z.boolean(),
    }),
  ),
  date: z.string().optional(),
});
