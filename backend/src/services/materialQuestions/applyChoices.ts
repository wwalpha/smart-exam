import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialQuestionsService } from './materialQuestions.types';

export const createApplyChoices = (repositories: Repositories): MaterialQuestionsService['applyChoices'] => {
  return async (params) => {
    // 教材が存在しない場合は何もしない。
    const material = await repositories.materials.get(params.materialId);
    if (!material) return;

    // 指定日が不正な場合は当日を基準日にする。
    const baseDateYmd = DateUtils.isValidYmd(params.baseDateYmd) ? params.baseDateYmd : DateUtils.todayYmd();
    // 教材配下の設問を取得して選択結果を反映する。
    const questions = await repositories.materialQuestions.listByMaterialId(params.materialId);

    await Promise.all(
      questions.map(async (question) => {
        // 正解扱いの設問は復習候補を作らない。
        if (question.choice !== 'INCORRECT') return;

        // 不正解として次回出題日時を計算する。
        const computed = ReviewNextTime.compute({
          mode: 'MATERIAL',
          baseDateYmd,
          isCorrect: false,
          currentCorrectCount: 0,
        });

        // 不正解の設問を復習候補として登録する。
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
