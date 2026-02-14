import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialTable } from '@/types/db';

import type { MaterialsService } from './createMaterialsService';
import { toApiMaterial } from './materialMappers';

const updateMaterialImpl = async (
  repositories: Repositories,
  materialId: string,
  updates: Partial<MaterialTable>,
): ReturnType<MaterialsService['updateMaterial']> => {
  const next = await repositories.materials.update(materialId, updates);
  if (!next) return null;
  return toApiMaterial(next);
};

export const createUpdateMaterial = (repositories: Repositories): MaterialsService['updateMaterial'] => {
  return updateMaterialImpl.bind(null, repositories);
};
