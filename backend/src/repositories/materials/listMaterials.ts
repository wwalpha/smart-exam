import { MaterialsService } from '@/services/MaterialsService';
import type { MaterialTable } from '@/types/db';
import type { Material } from '@/repositories/repo.types';
import { DateUtils } from '@/lib/dateUtils';

const requireYmd = (value: unknown, fieldName: string): string => {
  const trimmed = String(value ?? '').trim();
  if (!DateUtils.isValidYmd(trimmed)) {
    throw new Error(`${fieldName} is required (YYYY-MM-DD)`);
  }
  return trimmed;
};

const requireNonEmpty = (value: unknown, fieldName: string): string => {
  const trimmed = String(value ?? '').trim();
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  return trimmed;
};

export const listMaterials = async (): Promise<Material[]> => {
  const items = await MaterialsService.list();

  return items.map((dbItem: MaterialTable) => ({
    id: dbItem.materialId,
    name: dbItem.title,
    subject: dbItem.subjectId,
    grade: requireNonEmpty(dbItem.grade, 'Material.grade'),
    provider: requireNonEmpty(dbItem.provider, 'Material.provider'),
    materialDate: requireYmd(dbItem.materialDate, 'Material.materialDate'),
    registeredDate: requireYmd(dbItem.registeredDate ?? dbItem.materialDate, 'Material.registeredDate'),
  }));
};
