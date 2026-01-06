import { MaterialsService } from '@/services/MaterialsService';
import type { MaterialTable } from '@/types/db';
import type { Material } from '@/repositories/repo.types';
import { DateUtils } from '@/lib/dateUtils';

export const updateMaterial = async (materialId: string, updates: Partial<MaterialTable>): Promise<Material | null> => {
  const next = await MaterialsService.update(materialId, updates);
  if (!next) return null;

  const executionDate = (() => {
    const raw = next.executionDate ?? (next as unknown as { yearMonth?: string; date?: string }).date ?? (next as any).yearMonth;
    if (!raw) return DateUtils.todayYmd();
    const trimmed = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
    return DateUtils.todayYmd();
  })();

  return {
    id: next.materialId,
    name: next.title,
    subject: next.subjectId,
    grade: next.grade,
    provider: next.provider,
    executionDate,
  };
};
