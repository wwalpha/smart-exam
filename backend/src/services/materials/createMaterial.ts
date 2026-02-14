import type { Material } from '@smart-exam/api-types';

import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialTable } from '@/types/db';

import type { MaterialsService } from './createMaterialsService';

const createMaterialImpl = async (
  repositories: Repositories,
  data: Parameters<MaterialsService['createMaterial']>[0],
): Promise<Material> => {
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

  await repositories.materials.create(dbItem);

  return {
    id,
    ...data,
  };
};

export const createCreateMaterial = (repositories: Repositories): MaterialsService['createMaterial'] => {
  return createMaterialImpl.bind(null, repositories);
};
