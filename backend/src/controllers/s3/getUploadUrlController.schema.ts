import { z } from 'zod';

/** GetUploadUrlBodySchema validates input shape. */
export const GetUploadUrlBodySchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  prefix: z.string().optional(),
});
