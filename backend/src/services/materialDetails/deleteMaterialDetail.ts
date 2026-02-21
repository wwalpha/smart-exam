import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialDetailsService } from './materialDetails.types';

const deleteMaterialDetailImpl = async (repositories: Repositories, questionId: string): Promise<boolean> => {
  const existing = await repositories.materialDetails.get(questionId);
  if (!existing) return false;

  await repositories.examCandidates.deleteOpenCandidatesByTargetId({
    subject: existing.subjectId,
    targetId: questionId,
  });

  await repositories.materialDetails.delete(questionId);
  await repositories.materials.incrementQuestionCount(existing.materialId, -1);

  return true;
};

export const createDeleteMaterialDetail = (
  repositories: Repositories,
): MaterialDetailsService['deleteMaterialDetail'] => {
  return deleteMaterialDetailImpl.bind(null, repositories);
};
