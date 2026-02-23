import type { CreateMaterialResponse } from '@smart-exam/api-types';

import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialTable } from '@/types/db';

import type { MaterialsService } from './materials.types';

export const createCreateMaterial = async (
  repositories: Repositories,
  data: Parameters<MaterialsService['createMaterial']>[0],
): Promise<CreateMaterialResponse> => {
  const createdItems = await Promise.all(
    data.subject.map(async (subject) => {
      const id = createUuid();

      const dbItem: MaterialTable = {
        materialId: id,
        subjectId: subject,
        title: data.name,
        questionCount: 0,
        openCandidateCount: 0,
        grade: data.grade,
        provider: data.provider,
        materialDate: data.materialDate,
        registeredDate: data.registeredDate,
        isCompleted: false,
      };

      await repositories.materials.create(dbItem);

      return {
        id,
        name: data.name,
        subject,
        materialDate: data.materialDate,
        registeredDate: data.registeredDate,
        grade: data.grade,
        provider: data.provider,
        questionCount: 0,
        isCompleted: false,
      };
    }),
  );

  return {
    items: createdItems,
  };
};
