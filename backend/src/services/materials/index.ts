import type { Repositories } from '@/repositories/createRepositories';

import { createAnalyzeMaterial } from './analyzeMaterial';
import { createCreateMaterial } from './createMaterial';
import { createDeleteMaterial } from './deleteMaterial';
import { createGetMaterial } from './getMaterial';
import { createGetMaterialFile } from './getMaterialFile';
import { createListMaterialFiles } from './listMaterialFiles';
import { createListMaterials } from './listMaterials';
import { createListOpenCandidateMaterials } from './listOpenCandidateMaterials';
import { createSearchMaterials } from './searchMaterials';
import { createUploadMaterialFile } from './uploadMaterialFile';
import { createUpdateMaterial } from './updateMaterial';
import type { MaterialsService } from './materials.types';

export type { MaterialsService } from './materials.types';

export const createMaterialsService = (repositories: Repositories): MaterialsService => {
  const listMaterials: MaterialsService['listMaterials'] = () => createListMaterials(repositories);
  const listOpenCandidateMaterials: MaterialsService['listOpenCandidateMaterials'] = () =>
    createListOpenCandidateMaterials(repositories);
  const searchMaterials: MaterialsService['searchMaterials'] = (params) => createSearchMaterials(repositories, params);
  const createMaterial: MaterialsService['createMaterial'] = (data) => createCreateMaterial(repositories, data);
  const uploadMaterialFile: MaterialsService['uploadMaterialFile'] = (materialId, request) =>
    createUploadMaterialFile(repositories, materialId, request);
  const analyzeMaterial: MaterialsService['analyzeMaterial'] = (materialId) =>
    createAnalyzeMaterial(repositories, materialId);
  const getMaterial: MaterialsService['getMaterial'] = (materialId) => createGetMaterial(repositories, materialId);
  const updateMaterial: MaterialsService['updateMaterial'] = (materialId, updates) =>
    createUpdateMaterial(repositories, materialId, updates);
  const deleteMaterial: MaterialsService['deleteMaterial'] = (materialId) =>
    createDeleteMaterial(repositories, materialId);

  const listMaterialFiles: MaterialsService['listMaterialFiles'] = (materialId) =>
    createListMaterialFiles(repositories, materialId);
  const getMaterialFile: MaterialsService['getMaterialFile'] = (materialId, fileId) =>
    createGetMaterialFile({ repositories, listMaterialFiles }, materialId, fileId);

  return {
    listMaterials,
    listOpenCandidateMaterials,
    searchMaterials,
    createMaterial,
    uploadMaterialFile,
    analyzeMaterial,
    getMaterial,
    updateMaterial,
    deleteMaterial,
    listMaterialFiles,
    getMaterialFile,
  };
};

export { createMaterialsService as materialsService };
