import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialQuestionsService } from './materialQuestions.types';

const applyQuestionChoicesToCandidatesForMaterialImpl = async (
  repositories: Repositories,
  params: Parameters<MaterialQuestionsService['applyQuestionChoicesToCandidatesForMaterial']>[0],
): Promise<void> => {
  const material = await repositories.materials.get(params.materialId);
  if (!material) return;

  const baseDateYmd = DateUtils.isValidYmd(params.baseDateYmd) ? params.baseDateYmd : DateUtils.todayYmd();
  const questions = await repositories.materialQuestions.listByMaterialId(params.materialId);

  for (const question of questions) {
    const latestOpen = await repositories.examCandidates.getLatestOpenCandidateByTargetId({
      subject: question.subjectId,
      targetId: question.questionId,
    });

    const currentCorrectCount = latestOpen?.correctCount ?? 0;
    if (latestOpen) {
      await repositories.examCandidates.closeCandidateIfMatch({
        subject: question.subjectId,
        candidateKey: latestOpen.candidateKey,
      });
    }

    if (question.choice !== 'INCORRECT') {
      continue;
    }

    const computed = ReviewNextTime.compute({
      mode: 'MATERIAL',
      baseDateYmd,
      isCorrect: false,
      currentCorrectCount,
    });

    await repositories.examCandidates.createCandidate({
      subject: question.subjectId,
      questionId: question.questionId,
      mode: 'MATERIAL',
      nextTime: computed.nextTime,
      correctCount: computed.nextCorrectCount,
      status: 'OPEN',
    });
  }
};

export const createApplyQuestionChoicesToCandidatesForMaterial = (
  repositories: Repositories,
): MaterialQuestionsService['applyQuestionChoicesToCandidatesForMaterial'] => {
  return applyQuestionChoicesToCandidatesForMaterialImpl.bind(null, repositories);
};
