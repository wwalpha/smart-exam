import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialTable } from '@/types/db';
import { ApiError } from '@/lib/apiError';

import type { MaterialsService } from './materials.types';
import { toApiMaterial } from './materialMappers';

export const createUpdateMaterial = async (
  repositories: Repositories,
  materialId: string,
  updates: Partial<MaterialTable>,
): ReturnType<MaterialsService['updateMaterial']> => {
  const existing = await repositories.materials.get(materialId);
  if (!existing) return null;

  if (existing.isCompleted === true) {
    const allowedOnCompleted = new Set([
      'questionPdfPath',
      'answerPdfPath',
      'answerSheetPath',
      'questionPdfFilename',
      'answerPdfFilename',
      'answerSheetFilename',
    ]);
    const requestedKeys = Object.keys(updates).filter((key) => updates[key as keyof MaterialTable] !== undefined);
    const hasDisallowedUpdate = requestedKeys.some((key) => !allowedOnCompleted.has(key));
    if (hasDisallowedUpdate) {
      throw new ApiError('material is completed', 409, ['material_already_completed']);
    }
  }

  const next = await repositories.materials.update(materialId, updates);
  if (!next) return null;
  return toApiMaterial(next);
};
