import type { Question } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialDetailsService } from './materialDetails.types';
import { toSortNumber } from './toSortNumber';

const updateMaterialDetailImpl = async (
  repositories: Repositories,
  questionId: string,
  updates: Parameters<MaterialDetailsService['updateMaterialDetail']>[1],
): Promise<Question | null> => {
  const existing = await repositories.materialDetails.get(questionId);
  if (!existing) return null;

  const next = await repositories.materialDetails.update(questionId, {
    ...(typeof updates.subject === 'string' ? { subjectId: updates.subject } : {}),
    ...(typeof updates.canonicalKey === 'string'
      ? { canonicalKey: updates.canonicalKey, number: toSortNumber(updates.canonicalKey) }
      : {}),
  });

  if (!next) return null;

  return {
    id: next.questionId,
    canonicalKey: next.canonicalKey,
    subject: next.subjectId,
    materialId: next.materialId,
    tags: updates.tags ?? [],
  };
};

export const createUpdateMaterialDetail = (
  repositories: Repositories,
): MaterialDetailsService['updateMaterialDetail'] => {
  return updateMaterialDetailImpl.bind(null, repositories);
};
