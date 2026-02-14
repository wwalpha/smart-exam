import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './createMaterialsService';
import { toApiMaterial } from './materialMappers';

const getMaterialImpl = async (
  repositories: Repositories,
  materialId: string,
): ReturnType<MaterialsService['getMaterial']> => {
  const dbItem = await repositories.materials.get(materialId);
  if (!dbItem) return null;
  return toApiMaterial(dbItem);
};

export const createGetMaterial = (repositories: Repositories): MaterialsService['getMaterial'] => {
  return getMaterialImpl.bind(null, repositories);
};
