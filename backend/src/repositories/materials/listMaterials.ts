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
    materialDate: (() => {
      const raw = dbItem.materialDate;
      if (!raw) return DateUtils.todayYmd();
      const trimmed = String(raw).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      return DateUtils.todayYmd();
    })(),
  }));
};
