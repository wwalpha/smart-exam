import { AttemptsService } from '../services/AttemptsService';
import { AttemptTable, AttemptResultItem } from '../types/db';
import { Attempt, AttemptResult } from './repo.types';
import { randomUUID } from 'crypto';
import { DateUtils } from '@/lib/dateUtils';

export const AttemptsRepository = {
  createAttempt: async (testId: string, subjectId: string): Promise<Attempt> => {
    const now = DateUtils.now();
    const id = randomUUID();
    
    const item: Attempt = {
      attemptId: id,
      testId: testId,
      subjectId: subjectId,
      status: 'IN_PROGRESS',
      startedAt: now,
      results: [],
    };

    const dbItem: AttemptTable = {
      attemptId: id,
      testId: testId,
      subjectId: subjectId,
      status: 'IN_PROGRESS',
      startedAt: now,
      results: [],
    };

    await AttemptsService.create(dbItem);

    return item;
  },

  submitAttempt: async (attemptId: string, results: AttemptResult[]): Promise<Attempt | null> => {
    const now = DateUtils.now();
    
    try {
      const dbResults: AttemptResultItem[] = results.map(r => ({
        questionId: r.questionId,
        number: r.number,
        isCorrect: r.isCorrect
      }));

      const updated = await AttemptsService.update(attemptId, {
        status: 'SUBMITTED',
        submittedAt: now,
        results: dbResults,
      });

      if (!updated) return null;

      return {
        attemptId: updated.attemptId,
        testId: updated.testId,
        subjectId: updated.subjectId,
        status: updated.status,
        startedAt: updated.startedAt,
        submittedAt: updated.submittedAt,
        results: updated.results.map(r => ({
          questionId: r.questionId,
          number: r.number,
          isCorrect: r.isCorrect
        })),
      };
    } catch (e) {
      console.error('Error submitting attempt:', e);
      throw e;
    }
  },

  getLatestAttempt: async (testId: string): Promise<Attempt | null> => {
    const dbItem = await AttemptsService.findLatestByTestId(testId);

    if (!dbItem) return null;

    return {
      attemptId: dbItem.attemptId,
      testId: dbItem.testId,
      subjectId: dbItem.subjectId,
      status: dbItem.status,
      startedAt: dbItem.startedAt,
      submittedAt: dbItem.submittedAt,
      results: dbItem.results.map(r => ({
        questionId: r.questionId,
        number: r.number,
        isCorrect: r.isCorrect
      })),
    };
  }
};
