import { MaterialsService } from '@/services/MaterialsService';
import type { Material } from '@/repositories/repo.types';
import { DateUtils } from '@/lib/dateUtils';

export const getMaterial = async (id: string): Promise<Material | null> => {
  const dbItem = await MaterialsService.get(id);

  if (!dbItem) return null;

  return {
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
  };
};
