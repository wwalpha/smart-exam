import { z } from 'zod';

import { DateUtils } from '@/lib/dateUtils';
import { SubjectIdSchema } from '@/lib/zodSchemas';

const PositiveIntFromUnknownSchema = z.preprocess((v) => {
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed.length === 0) return v;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, z.number().int().positive());

const BooleanFromUnknownSchema = z.preprocess((v) => {
  if (typeof v === 'string') {
    const trimmed = v.trim().toLowerCase();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
  }
  return v;
}, z.boolean());

const queryString = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string());
const queryStringOptional = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

export const CreateTestBodySchema = z.object({
  subject: SubjectIdSchema,
  count: PositiveIntFromUnknownSchema,
  days: PositiveIntFromUnknownSchema.optional(),
  rangeFrom: z.string().optional(),
  rangeTo: z.string().optional(),
  includeCorrect: BooleanFromUnknownSchema.optional(),
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
