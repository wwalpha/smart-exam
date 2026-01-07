import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { MaterialsService } from '@/services/MaterialsService';
import { QuestionsService } from '@/services/QuestionsService';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

export const markQuestionCorrect = async (questionId: string): Promise<boolean> => {
  const q = await QuestionsService.get(questionId);
  if (!q) return false;

  const open = await ReviewTestCandidatesService.getLatestOpenCandidateByTargetId({
    subject: q.subjectId,
    targetId: questionId,
  });

  if (open) {
    // 正解の場合は候補にしない（DBに残さない）
    await ReviewTestCandidatesService.deleteCandidate({ subject: q.subjectId, candidateKey: open.candidateKey });
  }

  return true;
};

export const markQuestionIncorrect = async (questionId: string): Promise<boolean> => {
  const q = await QuestionsService.get(questionId);
  if (!q) return false;

  const material = await MaterialsService.get(q.materialId);
  const preferred = material?.registeredDate ?? material?.materialDate ?? '';
  const baseDateYmd = DateUtils.isValidYmd(preferred) ? preferred : DateUtils.todayYmd();

  const open = await ReviewTestCandidatesService.getLatestOpenCandidateByTargetId({
    subject: q.subjectId,
    targetId: questionId,
  });

  const currentCorrectCount = open ? open.correctCount : 0;
  if (open) {
    await ReviewTestCandidatesService.closeCandidateIfMatch({ subject: q.subjectId, candidateKey: open.candidateKey });
  }

  const computed = ReviewNextTime.compute({
    mode: 'QUESTION',
    baseDateYmd,
    isCorrect: false,
    currentCorrectCount,
  });

  await ReviewTestCandidatesService.createCandidate({
    subject: q.subjectId,
    questionId,
    mode: 'QUESTION',
    nextTime: computed.nextTime,
    correctCount: computed.nextCorrectCount,
    status: 'OPEN',
  });

  return true;
};
