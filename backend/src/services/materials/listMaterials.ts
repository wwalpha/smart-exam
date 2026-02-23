import type { Material } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import { toApiMaterial } from './materialMappers';
import { sortMaterialsForList } from './materialSort';

export const createListMaterials = async (repositories: Repositories): Promise<Material[]> => {
  const items = await repositories.materials.list();
  return sortMaterialsForList(items.map(toApiMaterial));
};
