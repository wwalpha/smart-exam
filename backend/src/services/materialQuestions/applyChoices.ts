import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialQuestionsService } from './materialQuestions.types';

export const createApplyChoices = (repositories: Repositories): MaterialQuestionsService['applyChoices'] => {
  return async (params) => {
    const material = await repositories.materials.get(params.materialId);
    if (!material) return;

    const baseDateYmd = DateUtils.isValidYmd(params.baseDateYmd) ? params.baseDateYmd : DateUtils.todayYmd();
    const questions = await repositories.materialQuestions.listByMaterialId(params.materialId);

    await Promise.all(
      questions.map(async (question) => {
        if (question.choice !== 'INCORRECT') return;

        const computed = ReviewNextTime.compute({
          mode: 'MATERIAL',
          baseDateYmd,
          isCorrect: false,
          currentCorrectCount: 0,
        });

        await repositories.examCandidates.createCandidate({
          subject: question.subjectId,
          questionId: question.questionId,
          mode: 'MATERIAL',
          nextTime: computed.nextTime,
          correctCount: computed.nextCorrectCount,
          status: 'OPEN',
        });
      }),
    );
  };
};
