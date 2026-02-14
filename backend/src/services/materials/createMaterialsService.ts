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
  // 処理で使う値を準備する
  const listMaterials = createListMaterials(repositories);
  // 処理で使う値を準備する
  const searchMaterials = createSearchMaterials({ listMaterials });
  // 処理で使う値を準備する
  const createMaterial = createCreateMaterial(repositories);
  // 処理で使う値を準備する
  const getMaterial = createGetMaterial(repositories);
  // 処理で使う値を準備する
  const updateMaterial = createUpdateMaterial(repositories);
  // 処理で使う値を準備する
  const deleteMaterial = createDeleteMaterial(repositories);

  // 処理で使う値を準備する
  const listMaterialFiles = createListMaterialFiles(repositories);
  // 処理で使う値を準備する
  const getMaterialFile = createGetMaterialFile(repositories, { listMaterialFiles });

  // 処理結果を呼び出し元へ返す
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
