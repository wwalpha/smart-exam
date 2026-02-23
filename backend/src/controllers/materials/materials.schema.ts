import { z } from 'zod';

import { DateUtils } from '@/lib/dateUtils';
import { SubjectIdSchema } from '@/lib/zodSchemas';

/** CreateMaterialBodySchema validates input shape. */
export const CreateMaterialBodySchema = z.object({
  name: z.string().min(1),
  subject: z.array(SubjectIdSchema).min(1),
  materialDate: z.string().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  registeredDate: z.string().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  grade: z.string().min(1),
  provider: z.string().min(1),
});

/** SearchMaterialsBodySchema validates input shape. */
export const SearchMaterialsBodySchema = z.object({
  subject: SubjectIdSchema.optional(),
  grade: z.string().optional(),
  provider: z.string().optional(),
  from: z
    .string()
    .refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' })
    .optional(),
  to: z
    .string()
    .refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' })
    .optional(),
  q: z.string().optional(),
});

/** UpdateMaterialBodySchema validates input shape. */
export const UpdateMaterialBodySchema = z.object({
  name: z.string().min(1).optional(),
  subject: SubjectIdSchema.optional(),
  materialDate: z
    .string()
    .refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' })
    .optional(),
  grade: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  registeredDate: z
    .string()
    .refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' })
    .optional(),
  questionPdfPath: z.string().min(1).optional(),
  answerPdfPath: z.string().min(1).optional(),
  answerSheetPath: z.string().min(1).optional(),
});

export const UploadMaterialFileBodySchema = z.object({
  contentType: z.string().min(1),
  fileName: z.string().min(1),
  filetype: z.enum(['QUESTION', 'ANSWER', 'GRADED_ANSWER']),
});
