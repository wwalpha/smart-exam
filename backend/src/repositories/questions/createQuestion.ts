import { QuestionsService } from '@/services/QuestionsService';
import type { MaterialQuestionTable } from '@/types/db';
import type { CreateQuestionRequest, Question } from '@/repositories/repo.types';
import { createUuid } from '@/lib/uuid';
import { toSortNumber } from './toSortNumber';
import { MaterialsService } from '@/services/MaterialsService';
import { DateUtils } from '@/lib/dateUtils';
import { putCandidate } from '@/repositories/reviewTests/putCandidate';

export const createQuestion = async (data: CreateQuestionRequest & { materialId: string }): Promise<Question> => {
  const id = createUuid();

  const item: Question = {
    id,
    ...data,
  };

  const dbItem: MaterialQuestionTable = {
    questionId: id,
    materialId: data.materialId,
    subjectId: data.subject,
    number: toSortNumber(data.canonicalKey),
    canonicalKey: data.canonicalKey,
  };

  await QuestionsService.create(dbItem);

  await MaterialsService.incrementQuestionCount(data.materialId, 1);

  const material = await MaterialsService.get(data.materialId);
  const performedDate = (() => {
    const raw = material?.executionDate ?? (material as any)?.date ?? (material as any)?.yearMonth;
    if (!raw) return DateUtils.todayYmd();

    const trimmed = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
    return DateUtils.todayYmd();
  })();

  await putCandidate({
    subject: data.subject,
    questionId: id,
    mode: 'QUESTION',
    nextTime: performedDate,
  });

  return item;
};
