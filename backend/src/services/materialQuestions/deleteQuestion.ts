import type { Repositories } from '@/repositories/createRepositories';
import { ApiError } from '@/lib/apiError';

import type { MaterialQuestionsService } from './materialQuestionsService.types';

const deleteQuestionImpl = async (
  repositories: Repositories,
  materialId: string,
  questionId: string,
): Promise<boolean> => {
  const existing = await repositories.materialQuestions.get(questionId);
  if (!existing) return false;
  if (existing.materialId !== materialId) return false;

  const material = await repositories.materials.get(materialId);
  if (!material) {
    throw new ApiError('material not found', 404, ['material_not_found']);
  }
  if (material.isCompleted) {
    // 完了済み教材では設問を変更させない
    throw new ApiError('material is completed', 409, ['material_already_completed']);
  }

  await repositories.examCandidates.deleteOpenCandidatesByTargetId({
    subject: existing.subjectId,
    targetId: questionId,
  });

  await repositories.materialQuestions.delete(questionId);
  await repositories.materials.incrementQuestionCount(existing.materialId, -1);

  return true;
};

export const createDeleteQuestion = (repositories: Repositories): MaterialQuestionsService['deleteQuestion'] => {
  return deleteQuestionImpl.bind(null, repositories);
};
