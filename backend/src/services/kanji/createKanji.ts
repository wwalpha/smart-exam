import { WordMasterService } from '@/services/WordMasterService';
import type { WordMasterTable } from '@/types/db';
import type { CreateKanjiRequest, Kanji } from '@/services/repo.types';
import { createUuid } from '@/lib/uuid';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';
import { DateUtils } from '@/lib/dateUtils';

export const createKanji = async (data: CreateKanjiRequest): Promise<Kanji> => {
  const id = createUuid();

  const item: Kanji = { id, ...data };

  const dbItem: WordMasterTable = {
    wordId: id,
    question: data.kanji,
    answer: data.reading || '',
    subject: data.subject,
  };

  await WordMasterService.create(dbItem);

  // 候補を作成（新規作成時はOPEN）
  await ReviewTestCandidatesService.createCandidate({
    subject: data.subject,
    questionId: id,
    mode: 'KANJI',
    nextTime: DateUtils.todayYmd(),
    correctCount: 0,
    status: 'OPEN',
    createdAtIso: DateUtils.now(),
  });

  return item;
};
