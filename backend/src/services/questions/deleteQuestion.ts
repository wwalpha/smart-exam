import type { Repositories } from '@/repositories/createRepositories';

import type { QuestionsService } from './createQuestionsService';

export const createDeleteQuestion = (repositories: Repositories): QuestionsService['deleteQuestion'] => {
  return async (questionId) => {
    const existing = await repositories.questions.get(questionId);
    if (!existing) return false;

    await repositories.reviewTestCandidates.deleteOpenCandidatesByTargetId({
      subject: existing.subjectId,
      targetId: questionId,
    });

    await repositories.questions.delete(questionId);
    await repositories.materials.incrementQuestionCount(existing.materialId, -1);

    return true;
  };
};
