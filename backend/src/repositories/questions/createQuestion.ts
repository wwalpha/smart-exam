import { QuestionsService } from '@/services/QuestionsService';
import type { MaterialQuestionTable } from '@/types/db';
import type { CreateQuestionRequest, Question } from '@/repositories/repo.types';
import { createUuid } from '@/lib/uuid';
import { toSortNumber } from './toSortNumber';
import { MaterialsService } from '@/services/MaterialsService';
import { DateUtils } from '@/lib/dateUtils';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';
import { REVIEW_MODE } from '@smart-exam/api-types';

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

  const todayYmd = DateUtils.todayYmd();

  await ReviewTestCandidatesService.createCandidate({
    subject: data.subject,
    questionId: id,
    mode: REVIEW_MODE.QUESTION,
    nextTime: todayYmd,
    correctCount: 0,
    status: 'OPEN',
  });

  return item;
};
