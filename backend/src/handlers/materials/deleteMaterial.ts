import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { DeleteMaterialParams, DeleteMaterialResponse } from '@smart-exam/api-types';

export const deleteMaterial: AsyncHandler<
  DeleteMaterialParams,
  DeleteMaterialResponse | { error: string },
  {},
  ParsedQs
> = async (req, res) => {
  const { materialId } = req.params;
  const deleted = await MaterialRepository.deleteMaterial(materialId);
  if (!deleted) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.status(204).send();
};
