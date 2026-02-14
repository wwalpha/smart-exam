import type { Material } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './createMaterialsService';
import { toApiMaterial } from './materialMappers';

const listMaterialsImpl = async (repositories: Repositories): Promise<Material[]> => {
  const items = await repositories.materials.list();
  return items.map(toApiMaterial);
};

export const createListMaterials = (repositories: Repositories): MaterialsService['listMaterials'] => {
  return listMaterialsImpl.bind(null, repositories);
};
