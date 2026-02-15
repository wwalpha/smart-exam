// Module: createMaterialsService responsibilities.

import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialsService } from './createMaterialsService.types';

import { createCreateMaterial } from './createMaterial';
import { createDeleteMaterial } from './deleteMaterial';
import { createGetMaterial } from './getMaterial';
import { createGetMaterialFile } from './getMaterialFile';
import { createListMaterialFiles } from './listMaterialFiles';
import { createListMaterials } from './listMaterials';
import { createSearchMaterials } from './searchMaterials';
import { createUpdateMaterial } from './updateMaterial';

export type { MaterialsService } from './createMaterialsService.types';

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
