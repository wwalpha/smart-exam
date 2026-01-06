import { MaterialsService } from '@/services/MaterialsService';
import type { Material } from '@/repositories/repo.types';
import { DateUtils } from '@/lib/dateUtils';

export const getMaterial = async (id: string): Promise<Material | null> => {
  const dbItem = await MaterialsService.get(id);

  if (!dbItem) return null;

  const materialDate = (() => {
    const raw = dbItem.materialDate;
    if (!raw) return DateUtils.todayYmd();
    const trimmed = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    return DateUtils.todayYmd();
  })();

  return {
    id: dbItem.materialId,
    name: dbItem.title,
    subject: dbItem.subjectId,
    grade: dbItem.grade,
    provider: dbItem.provider,
    materialDate,
  };
};
