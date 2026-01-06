import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { CreateMaterialRequest, CreateMaterialResponse } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';

export const CreateMaterialBodySchema = z.object({
  name: z.string().min(1),
  subject: z.enum(['1', '2', '3', '4']),
  materialDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  grade: z.string().min(1),
  provider: z.string().min(1),
});

export const createMaterial: AsyncHandler<{}, CreateMaterialResponse, CreateMaterialRequest, ParsedQs> = async (req, res) => {
  const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateMaterialBodySchema>;
  const item = await MaterialRepository.createMaterial(body);
  res.status(201).json(item);
};
