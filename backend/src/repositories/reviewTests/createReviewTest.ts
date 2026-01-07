import { DateUtils } from '@/lib/dateUtils';
import { createUuid } from '@/lib/uuid';
import { ReviewTestsService } from '@/services';
import { WordsService } from '@/services/WordsService';
import type { CreateReviewTestRequest, ReviewTest } from '@smart-exam/api-types';
import type { ReviewTestTable, WordMasterTable } from '@/types/db';
import { listDueCandidates } from './listDueCandidates';
import { putCandidate } from './putCandidate';
import {
  computeDueDate,
  isWithinRange,
  parseFilterRange,
  ReviewCandidate,
  targetKeyOf,
  toApiReviewTest,
} from './internal';

export const createReviewTest = async (req: CreateReviewTestRequest): Promise<ReviewTest> => {
  const testId = createUuid();
  const createdDate = DateUtils.todayYmd();
  const range = parseFilterRange(req);

  const candidates: ReviewCandidate[] = [];

  if (req.mode === 'KANJI') {
    const words = await WordsService.listKanji(req.subject);
    for (const w of words as WordMasterTable[]) {
      const registeredDate = createdDate;
      const { dueDate, lastAttemptDate } = computeDueDate({ targetType: 'KANJI', registeredDate });

      if (dueDate === null) continue;
      if (!isWithinRange(lastAttemptDate, range)) continue;

      candidates.push({
        targetType: 'KANJI',
        targetId: w.wordId,
        subject: w.subject,
        registeredDate,
        dueDate,
        lastAttemptDate,
      });
    }
  } else {
    const due = await listDueCandidates({ subject: req.subject, mode: 'QUESTION' });
    for (const c of due) {
      if (!c.nextTime) continue;
      candidates.push({
        targetType: 'QUESTION',
        targetId: c.questionId,
        subject: c.subject,
        registeredDate: createdDate,
        dueDate: c.nextTime,
        lastAttemptDate: '',
        candidateKey: c.candidateKey,
      });
    }
  }

  // 要件 8.3: dueDate asc -> lastAttemptDate asc -> ID asc (deterministic)
  candidates.sort((a, b) => {
    if (a.dueDate !== b.dueDate) return (a.dueDate ?? '') < (b.dueDate ?? '') ? -1 : 1;
    if (a.lastAttemptDate !== b.lastAttemptDate) return a.lastAttemptDate < b.lastAttemptDate ? -1 : 1;
    if (a.targetId !== b.targetId) return a.targetId < b.targetId ? -1 : 1;
    return a.targetType < b.targetType ? -1 : a.targetType > b.targetType ? 1 : 0;
  });

  const selected: ReviewCandidate[] = [];
  for (const c of candidates) {
    if (selected.length >= req.count) break;
    if (!c.dueDate) continue;

    try {
      if (c.targetType === 'QUESTION') {
        await putCandidate({ subject: c.subject, candidateKey: c.candidateKey, testId });
      }
      selected.push(c);
    } catch (e: unknown) {
      const name = (e as { name?: string } | null)?.name;
      if (name === 'ConditionalCheckFailedException') continue;
      throw e;
    }
  }

  const targetIds = selected.map((c) => c.targetId);

  const testRow: ReviewTestTable = {
    testId,
    subject: req.subject,
    mode: req.mode,
    status: 'IN_PROGRESS',
    count: selected.length,
    questions: targetIds,
    createdDate,
    pdfS3Key: `review-tests/${testId}.pdf`,
    results: [],
  };

  await ReviewTestsService.put(testRow);

  return toApiReviewTest(testRow);
};
