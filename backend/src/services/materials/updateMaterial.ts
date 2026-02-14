import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialTable } from '@/types/db';

import type { MaterialsService } from './createMaterialsService';
import { toApiMaterial } from './materialMappers';

export const createUpdateMaterial = (repositories: Repositories): MaterialsService['updateMaterial'] => {
  return async (materialId, updates: Partial<MaterialTable>) => {
    const next = await repositories.materials.update(materialId, updates);
    if (!next) return null;
    return toApiMaterial(next);
  };
};
