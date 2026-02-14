import { z } from 'zod';

import { BooleanFromUnknownSchema } from '@/lib/zodSchemas';

const queryValue = (schema: z.ZodTypeAny) => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), schema);

/** GetExamPdfParamsSchema validates path params. */
export const GetExamPdfParamsSchema = z.object({
  testId: z.string().min(1),
});

/** GetExamPdfQuerySchema validates query string. */
export const GetExamPdfQuerySchema = z.object({
  direct: queryValue(BooleanFromUnknownSchema).optional(),
  download: queryValue(BooleanFromUnknownSchema).optional(),
  includeGenerated: queryValue(BooleanFromUnknownSchema).optional(),
});
