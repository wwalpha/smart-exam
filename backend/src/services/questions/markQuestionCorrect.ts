import type { Repositories } from '@/repositories/createRepositories';

import type { QuestionsService } from './createQuestionsService';

export const createMarkQuestionCorrect = (repositories: Repositories): QuestionsService['markQuestionCorrect'] => {
  return async (questionId) => {
    const q = await repositories.questions.get(questionId);
    if (!q) return false;

    const open = await repositories.examCandidates.getLatestOpenCandidateByTargetId({
      subject: q.subjectId,
      targetId: questionId,
    });

    if (open) {
      // 正解の場合は候補にしない（DBに残さない）
      await repositories.examCandidates.deleteCandidate({
        subject: q.subjectId,
        candidateKey: open.candidateKey,
      });
    }

    return true;
  };
};
