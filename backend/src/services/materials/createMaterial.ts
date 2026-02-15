import type { Material } from '@smart-exam/api-types';

import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialTable } from '@/types/db';

import type { MaterialsService } from './createMaterialsService';

// 内部で利用する処理を定義する
const createMaterialImpl = async (
  repositories: Repositories,
  data: Parameters<MaterialsService['createMaterial']>[0],
): Promise<Material> => {
  // 内部で利用する処理を定義する
  const id = createUuid();

  const dbItem: MaterialTable = {
    materialId: id,
    subjectId: data.subject,
    title: data.name,
    questionCount: 0,
    grade: data.grade,
    provider: data.provider,
    materialDate: data.materialDate,
    registeredDate: data.registeredDate,
  };

  // 非同期処理の完了を待つ
  await repositories.materials.create(dbItem);

  // 処理結果を呼び出し元へ返す
  return {
    id,
    ...data,
  };
};

// 公開する処理を定義する
export const createCreateMaterial = (repositories: Repositories): MaterialsService['createMaterial'] => {
  // 処理結果を呼び出し元へ返す
  return createMaterialImpl.bind(null, repositories);
};
