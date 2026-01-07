import { QuestionsService } from '@/services/QuestionsService';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { REVIEW_MODE } from '@smart-exam/api-types';

export const recalculateCandidatesForMaterial = async (params: {
  materialId: string;
  registeredDate: string;
}): Promise<void> => {
  const questions = await QuestionsService.listByMaterialId(params.materialId);

  for (const q of questions) {
    const open = await ReviewTestCandidatesService.getLatestOpenCandidateByTargetId({
      subject: q.subjectId,
      targetId: q.questionId,
    });

    if (!open) continue;

    await ReviewTestCandidatesService.closeCandidateIfMatch({
      subject: q.subjectId,
      candidateKey: open.candidateKey,
    });

    // 旧仕様のデータで正解系のOPENが残っていた場合は、候補から除外する
    if (open.correctCount > 0) {
      await ReviewTestCandidatesService.createCandidate({
        subject: q.subjectId,
        questionId: q.questionId,
        mode: REVIEW_MODE.QUESTION,
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

    await ReviewTestCandidatesService.createCandidate({
      subject: q.subjectId,
      questionId: q.questionId,
      mode: REVIEW_MODE.QUESTION,
      nextTime: computed.nextTime,
      correctCount: computed.nextCorrectCount,
      status: 'OPEN',
    });
  }
};
