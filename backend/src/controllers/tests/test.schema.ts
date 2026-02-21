import { z } from 'zod';

import { DateUtils } from '@/lib/dateUtils';
import { PositiveIntFromUnknownSchema, SubjectIdSchema } from '@/lib/zodSchemas';

const queryString = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string());
const queryStringOptional = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

export const CreateTestBodySchema = z.object({
  subject: SubjectIdSchema,
  count: PositiveIntFromUnknownSchema,
});

export const SearchTestsBodySchema = z.object({
  subject: z.union([z.literal('ALL'), SubjectIdSchema]),
  status: z.union([z.literal('ALL'), z.literal('IN_PROGRESS'), z.literal('COMPLETED')]).optional(),
  limit: z.number().int().positive().optional(),
  cursor: z.string().optional(),
});

export const ListTestTargetsQuerySchema = z.object({
  from: queryString().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  to: queryString().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
});
