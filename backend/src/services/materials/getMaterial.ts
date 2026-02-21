import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './createMaterialsService.types';
import { toApiMaterial } from './materialMappers';

// 内部で利用する処理を定義する
const getMaterialImpl = async (
  repositories: Repositories,
  materialId: string,
): ReturnType<MaterialsService['getMaterial']> => {
  // 内部で利用する処理を定義する
  const dbItem = await repositories.materials.get(materialId);
  // 条件に応じて処理を分岐する
  if (!dbItem) return null;
  // 処理結果を呼び出し元へ返す
  return toApiMaterial(dbItem);
};

// 公開する処理を定義する
export const createGetMaterial = (repositories: Repositories): MaterialsService['getMaterial'] => {
  // 処理結果を呼び出し元へ返す
  return getMaterialImpl.bind(null, repositories);
};
