import { MaterialsService } from '@/services/MaterialsService';
import type { MaterialTable } from '@/types/db';
import type { CreateMaterialRequest, Material } from '@/repositories/repo.types';
import { createUuid } from '@/lib/uuid';

export const createMaterial = async (data: CreateMaterialRequest): Promise<Material> => {
  const id = createUuid();

  const item: Material = {
    id,
    ...data,
  };

  const dbItem: MaterialTable = {
    materialId: id,
    subjectId: data.subject,
    title: data.name,
    description: data.description,
    questionCount: 0,
    grade: data.grade,
    provider: data.provider,
    course: data.course,
    keywords: data.keywords,
    yearMonth: data.yearMonth,
  };

  await MaterialsService.create(dbItem);

  return item;
};
