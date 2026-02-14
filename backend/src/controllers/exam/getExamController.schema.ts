import { z } from 'zod';

/** GetExamParamsSchema validates path params. */
export const GetExamParamsSchema = z.object({
  testId: z.string().min(1),
});
