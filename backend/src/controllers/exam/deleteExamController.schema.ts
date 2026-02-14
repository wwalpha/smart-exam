import { z } from 'zod';

/** DeleteExamParamsSchema validates path params. */
export const DeleteExamParamsSchema = z.object({
  testId: z.string().min(1),
});
