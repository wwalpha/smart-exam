import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { QuestionsService } from '@/services/QuestionsService';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

export const markQuestionCorrect = async (questionId: string): Promise<boolean> => {
  const q = await QuestionsService.get(questionId);
  if (!q) return false;

  const baseDateYmd = DateUtils.todayYmd();

  const open = await ReviewTestCandidatesService.getLatestOpenCandidateByTargetId({
    subject: q.subjectId,
    targetId: questionId,
  });

  const currentCorrectCount = open ? open.correctCount : 1;

  if (open) {
    await ReviewTestCandidatesService.closeCandidateIfMatch({ subject: q.subjectId, candidateKey: open.candidateKey });
  }

  const computed = ReviewNextTime.compute({
    mode: 'QUESTION',
    baseDateYmd,
    isCorrect: true,
    currentCorrectCount,
  });

  await ReviewTestCandidatesService.createCandidate({
    subject: q.subjectId,
    questionId,
    mode: 'QUESTION',
    nextTime: computed.nextTime,
    correctCount: computed.nextCorrectCount,
    status: computed.nextTime === ReviewNextTime.EXCLUDED_NEXT_TIME ? 'EXCLUDED' : 'OPEN',
  });
  return true;
};

export const markQuestionIncorrect = async (questionId: string): Promise<boolean> => {
  const q = await QuestionsService.get(questionId);
  if (!q) return false;

  const baseDateYmd = DateUtils.todayYmd();

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
