import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { GetMaterialParams, GetMaterialResponse } from '@smart-exam/api-types';

export const getMaterial: AsyncHandler<GetMaterialParams, GetMaterialResponse | { error: string }, {}, ParsedQs> = async (
  req,
  res
) => {
  const { materialId } = req.params;
  const item = await MaterialRepository.getMaterial(materialId);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};
