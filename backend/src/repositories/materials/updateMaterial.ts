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

export const updateMaterial = async (materialId: string, updates: Partial<MaterialTable>): Promise<Material | null> => {
  const next = await MaterialsService.update(materialId, updates);
  if (!next) return null;

  return {
    id: next.materialId,
    name: next.title,
    subject: next.subjectId,
    grade: requireNonEmpty(next.grade, 'Material.grade'),
    provider: requireNonEmpty(next.provider, 'Material.provider'),
    materialDate: requireYmd(next.materialDate, 'Material.materialDate'),
  };
};
