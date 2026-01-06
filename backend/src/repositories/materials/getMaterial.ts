import { MaterialsService } from '@/services/MaterialsService';
import type { Material } from '@/repositories/repo.types';
import { DateUtils } from '@/lib/dateUtils';

export const getMaterial = async (id: string): Promise<Material | null> => {
  const dbItem = await MaterialsService.get(id);

  if (!dbItem) return null;

  const executionDate = (() => {
    const raw = dbItem.executionDate ?? (dbItem as unknown as { yearMonth?: string; date?: string }).date ?? (dbItem as any).yearMonth;
    if (!raw) return DateUtils.todayYmd();
    const trimmed = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
    return DateUtils.todayYmd();
  })();

  return {
    id: dbItem.materialId,
    name: dbItem.title,
    subject: dbItem.subjectId,
    grade: dbItem.grade,
    provider: dbItem.provider,
    executionDate,
  };
};
