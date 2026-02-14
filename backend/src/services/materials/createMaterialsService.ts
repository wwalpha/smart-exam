// Module: createMaterialsService responsibilities.

import type {
  CreateMaterialRequest,
  Material,
  MaterialFile,
  SearchMaterialsRequest,
  SearchMaterialsResponse,
} from '@smart-exam/api-types';
import type { MaterialTable } from '@/types/db';
import type { Repositories } from '@/repositories/createRepositories';

import { createCreateMaterial } from './createMaterial';
import { createDeleteMaterial } from './deleteMaterial';
import { createGetMaterial } from './getMaterial';
import { createGetMaterialFile } from './getMaterialFile';
import { createListMaterialFiles } from './listMaterialFiles';
import { createListMaterials } from './listMaterials';
import { createSearchMaterials } from './searchMaterials';
import { createUpdateMaterial } from './updateMaterial';

/** Type definition for MaterialsService. */
export type MaterialsService = {
  listMaterials: () => Promise<Material[]>;
  searchMaterials: (params: SearchMaterialsRequest) => Promise<SearchMaterialsResponse>;
  createMaterial: (data: CreateMaterialRequest) => Promise<Material>;
  getMaterial: (materialId: string) => Promise<Material | null>;
  updateMaterial: (materialId: string, updates: Partial<MaterialTable>) => Promise<Material | null>;
  deleteMaterial: (materialId: string) => Promise<boolean>;
  listMaterialFiles: (materialId: string) => Promise<MaterialFile[]>;
  getMaterialFile: (
    materialId: string,
    fileId: string,
  ) => Promise<{ body: Buffer; contentType: string; filename: string } | null>;
};

/** Creates materials service. */
export const createMaterialsService = (repositories: Repositories): MaterialsService => {
  const listMaterials = createListMaterials(repositories);
  const searchMaterials = createSearchMaterials({ listMaterials });
  const createMaterial = createCreateMaterial(repositories);
  const getMaterial = createGetMaterial(repositories);
  const updateMaterial = createUpdateMaterial(repositories);
  const deleteMaterial = createDeleteMaterial(repositories);

  const listMaterialFiles = createListMaterialFiles(repositories);
  const getMaterialFile = createGetMaterialFile(repositories, { listMaterialFiles });

  return {
    listMaterials,
    searchMaterials,
    createMaterial,
    getMaterial,
    updateMaterial,
    deleteMaterial,
    listMaterialFiles,
    getMaterialFile,
  };
};
