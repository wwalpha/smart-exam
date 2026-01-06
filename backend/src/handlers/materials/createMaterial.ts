import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { CreateMaterialRequest, CreateMaterialResponse } from '@smart-exam/api-types';

export const createMaterial: AsyncHandler<{}, CreateMaterialResponse, CreateMaterialRequest, ParsedQs> = async (
  req,
  res
) => {
  const item = await MaterialRepository.createMaterial(req.body);
  res.status(201).json(item);
};
