import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { createUuid } from '../lib/uuid';
import type { WordTestAttemptTable } from '../types/db';
import { WordsService } from '../services/WordsService';
import { WordIncorrectRepository } from './wordIncorrectRepository';

const TABLE_NAME = ENV.TABLE_WORD_TEST_ATTEMPTS;

export type CreateSubmittedWordTestAttemptInput = {
  wordTestId: string;
  startedAt: string;
  submittedAt: string;
  results: { wordId: string; isCorrect: boolean; subject?: string }[];
};

export const WordTestAttemptRepository = {
  createSubmittedAttempt: async (
    input: CreateSubmittedWordTestAttemptInput
  ): Promise<{ wordTestAttemptId: string }> => {
    const wordTestAttemptId = createUuid();

    const item: WordTestAttemptTable = {
      wordTestAttemptId,
      wordTestId: input.wordTestId,
      status: 'SUBMITTED',
      startedAt: input.startedAt,
      submittedAt: input.submittedAt,
      results: input.results,
    };

    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
    });

    const incorrectResults = input.results.filter((r) => !r.isCorrect);
    for (const r of incorrectResults) {
      const subject = r.subject ?? (await WordsService.get(r.wordId))?.subject;
      if (!subject) continue;

      await WordIncorrectRepository.upsertLastIncorrectAt({
        wordId: r.wordId,
        subject,
        occurredAt: input.submittedAt,
      });
    }

    return { wordTestAttemptId };
  },
};
