import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { CreateMaterialRequest, CreateMaterialResponse } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';
import { DateUtils } from '@/lib/dateUtils';
import { SubjectIdSchema } from '@/lib/zodSchemas';

export const CreateMaterialBodySchema = z.object({
  name: z.string().min(1),
  subject: SubjectIdSchema,
  materialDate: z.string().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
  grade: z.string().min(1),
  provider: z.string().min(1),
});

export const createMaterial: AsyncHandler<{}, CreateMaterialResponse, CreateMaterialRequest, ParsedQs> = async (req, res) => {
  const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateMaterialBodySchema>;
  const item = await MaterialRepository.createMaterial(body);
  res.status(201).json(item);
};
