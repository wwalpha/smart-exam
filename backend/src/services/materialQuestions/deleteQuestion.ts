import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialQuestionsService } from './materialQuestions.types';

const deleteQuestionImpl = async (repositories: Repositories, questionId: string): Promise<boolean> => {
  const existing = await repositories.materialQuestions.get(questionId);
  if (!existing) return false;

  await repositories.examCandidates.deleteOpenCandidatesByTargetId({
    subject: existing.subjectId,
    targetId: questionId,
  });

  await repositories.materialQuestions.delete(questionId);
  await repositories.materials.incrementQuestionCount(existing.materialId, -1);

  return true;
};

export const createDeleteQuestion = (
  repositories: Repositories,
): MaterialQuestionsService['deleteQuestion'] => {
  return deleteQuestionImpl.bind(null, repositories);
};
