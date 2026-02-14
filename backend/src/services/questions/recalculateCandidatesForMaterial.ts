import { ReviewNextTime } from '@/lib/reviewNextTime';
import type { Repositories } from '@/repositories/createRepositories';

import type { QuestionsService } from './createQuestionsService';

export const createRecalculateCandidatesForMaterial = (
  repositories: Repositories,
): QuestionsService['recalculateCandidatesForMaterial'] => {
  return async (params) => {
    const questions = await repositories.questions.listByMaterialId(params.materialId);

    for (const q of questions) {
      const open = await repositories.examCandidates.getLatestOpenCandidateByTargetId({
        subject: q.subjectId,
        targetId: q.questionId,
      });

      if (!open) continue;

      await repositories.examCandidates.closeCandidateIfMatch({
        subject: q.subjectId,
        candidateKey: open.candidateKey,
      });

      // 旧仕様のデータで正解系のOPENが残っていた場合は、候補から除外する
      if (open.correctCount > 0) {
        await repositories.examCandidates.createCandidate({
          subject: q.subjectId,
          questionId: q.questionId,
          mode: 'QUESTION',
          nextTime: ReviewNextTime.EXCLUDED_NEXT_TIME,
          correctCount: open.correctCount,
          status: 'EXCLUDED',
        });
        continue;
      }

      const computed = ReviewNextTime.compute({
        mode: 'QUESTION',
        baseDateYmd: params.registeredDate,
        isCorrect: false,
        currentCorrectCount: 0,
      });

      await repositories.examCandidates.createCandidate({
        subject: q.subjectId,
        questionId: q.questionId,
        mode: 'QUESTION',
        nextTime: computed.nextTime,
        correctCount: computed.nextCorrectCount,
        status: 'OPEN',
      });
    }
  };
};
