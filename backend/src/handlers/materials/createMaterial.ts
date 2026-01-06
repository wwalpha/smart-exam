import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { CreateMaterialRequest, CreateMaterialResponse } from '@smart-exam/api-types';

const isValidYmd = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const createMaterial: AsyncHandler<{}, CreateMaterialResponse | { error: string }, CreateMaterialRequest, ParsedQs> = async (
  req,
  res
) => {
  if (!isNonEmptyString(req.body?.grade) || !isNonEmptyString(req.body?.provider) || !isValidYmd(req.body?.materialDate)) {
    res.status(400).json({ error: 'grade/provider/materialDate are required' });
    return;
  }
  const item = await MaterialRepository.createMaterial(req.body);
  res.status(201).json(item);
};
