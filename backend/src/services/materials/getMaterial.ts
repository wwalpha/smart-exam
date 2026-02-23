import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './materials.types';
import { toApiMaterial } from './materialMappers';

export const createGetMaterial = async (
  repositories: Repositories,
  materialId: string,
): ReturnType<MaterialsService['getMaterial']> => {
  const dbItem = await repositories.materials.get(materialId);
  if (!dbItem) return null;
  return toApiMaterial(dbItem);
};
