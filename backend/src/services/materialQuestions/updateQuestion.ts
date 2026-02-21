import type { Question } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialQuestionsService } from './materialQuestions.types';
import { toSortNumber } from './materialQuestions.lib';

const updateQuestionImpl = async (
  repositories: Repositories,
  materialId: string,
  questionId: string,
  updates: Parameters<MaterialQuestionsService['updateQuestion']>[2],
): Promise<Question | null> => {
  const existing = await repositories.materialQuestions.get(questionId);
  if (!existing) return null;
  if (existing.materialId !== materialId) return null;

  const material = await repositories.materials.get(materialId);
  if (!material) {
    throw new ApiError('material not found', 404, ['material_not_found']);
  }
  if (material.isCompleted) {
    // 完了済み教材では設問を変更させない
    throw new ApiError('material is completed', 409, ['material_already_completed']);
  }

  const next = await repositories.materialQuestions.update(questionId, {
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
    choice: next.choice,
    tags: updates.tags ?? [],
  };
};

export const createUpdateQuestion = (repositories: Repositories): MaterialQuestionsService['updateQuestion'] => {
  return updateQuestionImpl.bind(null, repositories);
};
