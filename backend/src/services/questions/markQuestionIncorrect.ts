import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import type { Repositories } from '@/repositories/createRepositories';

import type { QuestionsService } from './createQuestionsService';

export const createMarkQuestionIncorrect = (repositories: Repositories): QuestionsService['markQuestionIncorrect'] => {
  return async (questionId) => {
    const q = await repositories.questions.get(questionId);
    if (!q) return false;

    const material = await repositories.materials.get(q.materialId);
    const preferred = material?.registeredDate ?? material?.materialDate ?? '';
    const baseDateYmd = DateUtils.isValidYmd(preferred) ? preferred : DateUtils.todayYmd();

    const open = await repositories.examCandidates.getLatestOpenCandidateByTargetId({
      subject: q.subjectId,
      targetId: questionId,
    });

    const currentCorrectCount = open ? open.correctCount : 0;
    if (open) {
      await repositories.examCandidates.closeCandidateIfMatch({
        subject: q.subjectId,
        candidateKey: open.candidateKey,
      });
    }

    const computed = ReviewNextTime.compute({
      mode: 'QUESTION',
      baseDateYmd,
      isCorrect: false,
      currentCorrectCount,
    });

    await repositories.examCandidates.createCandidate({
      subject: q.subjectId,
      questionId,
      mode: 'QUESTION',
      nextTime: computed.nextTime,
      correctCount: computed.nextCorrectCount,
      status: 'OPEN',
    });

    return true;
  };
};
