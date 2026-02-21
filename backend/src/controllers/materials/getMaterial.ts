import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { GetMaterialParams, GetMaterialResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const getMaterial = (services: Services): AsyncHandler<
  GetMaterialParams,
  GetMaterialResponse | { error: string },
  Record<string, never>,
  ParsedQs
> => async (req, res) => {
  const { materialId } = req.params;
  const item = await services.materials.getMaterial(materialId);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};
