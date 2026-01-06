import { MaterialsService } from '@/services/MaterialsService';
import type { MaterialTable } from '@/types/db';
import type { Material } from '@/repositories/repo.types';
import { DateUtils } from '@/lib/dateUtils';

export const listMaterials = async (): Promise<Material[]> => {
  const items = await MaterialsService.list();

  return items.map((dbItem: MaterialTable) => ({
    id: dbItem.materialId,
    name: dbItem.title,
    subject: dbItem.subjectId,
    grade: dbItem.grade,
    provider: dbItem.provider,
    course: dbItem.course,
    description: dbItem.description,
    keywords: dbItem.keywords,
    yearMonth: dbItem.yearMonth ?? (dbItem.date ? dbItem.date.slice(0, 7) : DateUtils.now().slice(0, 7)),
    date: dbItem.date,
  }));
};
