import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { MaterialsService } from '@/services/MaterialsService';
import { QuestionsService } from '@/services/QuestionsService';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

const toPerformedDateYmdFromMaterial = (raw: string | undefined | null): string => {
  if (!raw) return DateUtils.todayYmd();
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
  return DateUtils.todayYmd();
};

export const markQuestionCorrect = async (questionId: string): Promise<boolean> => {
  const q = await QuestionsService.get(questionId);
  if (!q) return false;

  await ReviewTestCandidatesService.deleteAny({ subject: q.subjectId, questionId });
  return true;
};

export const markQuestionIncorrect = async (questionId: string): Promise<boolean> => {
  const q = await QuestionsService.get(questionId);
  if (!q) return false;

  const material = await MaterialsService.get(q.materialId);
  const performedDateYmd = toPerformedDateYmdFromMaterial(
    material?.executionDate ?? (material as any)?.date ?? (material as any)?.yearMonth
  );

  const computed = ReviewNextTime.compute({
    mode: 'QUESTION',
    baseDateYmd: performedDateYmd,
    isCorrect: false,
    currentCorrectCount: 0,
  });

  await ReviewTestCandidatesService.upsertCandidate({
    subject: q.subjectId,
    questionId,
    mode: 'QUESTION',
    nextTime: computed.nextTime,
    correctCount: computed.nextCorrectCount,
  });

  return true;
};
