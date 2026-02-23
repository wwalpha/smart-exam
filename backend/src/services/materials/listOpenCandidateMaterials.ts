import type { Material } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import { toApiMaterial } from './materialMappers';
import { sortMaterialsForList } from './material.lib';

export const createListOpenCandidateMaterials = async (repositories: Repositories): Promise<Material[]> => {
  const items = await repositories.materials.listWithOpenCandidates();
  return sortMaterialsForList(items.map(toApiMaterial));
};
