import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './createMaterialsService';
import { toApiMaterial } from './materialMappers';

export const createGetMaterial = (repositories: Repositories): MaterialsService['getMaterial'] => {
  return async (materialId) => {
    const dbItem = await repositories.materials.get(materialId);
    if (!dbItem) return null;
    return toApiMaterial(dbItem);
  };
};
