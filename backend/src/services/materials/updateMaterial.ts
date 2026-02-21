import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialTable } from '@/types/db';
import { ApiError } from '@/lib/apiError';

import type { MaterialsService } from './materials.types';
import { toApiMaterial } from './materialMappers';

// 内部で利用する処理を定義する
const updateMaterialImpl = async (
  repositories: Repositories,
  materialId: string,
  updates: Partial<MaterialTable>,
): ReturnType<MaterialsService['updateMaterial']> => {
  const existing = await repositories.materials.get(materialId);
  if (!existing) return null;

  if (existing.isCompleted === true) {
    const allowedOnCompleted = new Set(['questionPdfPath', 'answerPdfPath', 'answerSheetPath']);
    const requestedKeys = Object.keys(updates).filter((key) => updates[key as keyof MaterialTable] !== undefined);
    const hasDisallowedUpdate = requestedKeys.some((key) => !allowedOnCompleted.has(key));
    if (hasDisallowedUpdate) {
      // 完了後は設問編集を防止し、ファイル差し替えだけを許可する
      throw new ApiError('material is completed', 409, ['material_already_completed']);
    }
  }

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
