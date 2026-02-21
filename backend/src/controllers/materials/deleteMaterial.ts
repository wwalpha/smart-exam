import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { DeleteMaterialParams, DeleteMaterialResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const deleteMaterial = (services: Services): AsyncHandler<
  DeleteMaterialParams,
  DeleteMaterialResponse | { error: string },
  Record<string, never>,
  ParsedQs
> => async (req, res) => {
  const { materialId } = req.params;
  const deleted = await services.materials.deleteMaterial(materialId);
  if (!deleted) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.status(204).send();
};
