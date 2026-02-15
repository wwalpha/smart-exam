import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialTable } from '@/types/db';

import type { MaterialsService } from './createMaterialsService';
import { toApiMaterial } from './materialMappers';

// 内部で利用する処理を定義する
const updateMaterialImpl = async (
  repositories: Repositories,
  materialId: string,
  updates: Partial<MaterialTable>,
): ReturnType<MaterialsService['updateMaterial']> => {
  // 内部で利用する処理を定義する
  const next = await repositories.materials.update(materialId, updates);
  // 条件に応じて処理を分岐する
  if (!next) return null;
  // 処理結果を呼び出し元へ返す
  return toApiMaterial(next);
};

// 公開する処理を定義する
export const createUpdateMaterial = (repositories: Repositories): MaterialsService['updateMaterial'] => {
  // 処理結果を呼び出し元へ返す
  return updateMaterialImpl.bind(null, repositories);
};
