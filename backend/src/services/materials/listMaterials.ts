import type { Material } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './createMaterialsService';
import { toApiMaterial } from './materialMappers';

export const createListMaterials = (repositories: Repositories): MaterialsService['listMaterials'] => {
  return async (): Promise<Material[]> => {
    const items = await repositories.materials.list();
    return items.map(toApiMaterial);
  };
};
