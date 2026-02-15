import type { Material } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './createMaterialsService';
import { toApiMaterial } from './materialMappers';

// 内部で利用する処理を定義する
const listMaterialsImpl = async (repositories: Repositories): Promise<Material[]> => {
  // 内部で利用する処理を定義する
  const items = await repositories.materials.list();
  // 処理結果を呼び出し元へ返す
  return items.map(toApiMaterial);
};

// 公開する処理を定義する
export const createListMaterials = (repositories: Repositories): MaterialsService['listMaterials'] => {
  // 処理結果を呼び出し元へ返す
  return listMaterialsImpl.bind(null, repositories);
};
