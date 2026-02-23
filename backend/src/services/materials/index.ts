import type { Repositories } from '@/repositories/createRepositories';

import { createCreateMaterial } from './createMaterial';
import { createDeleteMaterial } from './deleteMaterial';
import { createGetMaterial } from './getMaterial';
import { createGetMaterialFile } from './getMaterialFile';
import { createListMaterialFiles } from './listMaterialFiles';
import { createListMaterials } from './listMaterials';
import { createSearchMaterials } from './searchMaterials';
import { createUploadMaterialFile } from './uploadMaterialFile';
import { createUpdateMaterial } from './updateMaterial';
import type { MaterialsService } from './materials.types';

export type { MaterialsService } from './materials.types';

export const createMaterialsService = (repositories: Repositories): MaterialsService => {
  const listMaterials = createListMaterials(repositories);
  const searchMaterials = createSearchMaterials(repositories);
  const createMaterial = createCreateMaterial(repositories);
  const uploadMaterialFile = createUploadMaterialFile(repositories);
  const getMaterial = createGetMaterial(repositories);
  const updateMaterial = createUpdateMaterial(repositories);
  const deleteMaterial = createDeleteMaterial(repositories);

  const listMaterialFiles = createListMaterialFiles(repositories);
  const getMaterialFile = createGetMaterialFile(repositories, { listMaterialFiles });

  return {
    listMaterials,
    searchMaterials,
    createMaterial,
    uploadMaterialFile,
    getMaterial,
    updateMaterial,
    deleteMaterial,
    listMaterialFiles,
    getMaterialFile,
  };
};

export { createMaterialsService as materialsService };
