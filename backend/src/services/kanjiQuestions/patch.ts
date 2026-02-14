import type { KanjiQuestionPatchResponse } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiQuestionsService } from './createKanjiQuestionsService';
import { toKanjiQuestion } from './toKanjiQuestion';
import { validateKanjiQuestionFields } from './validateKanjiQuestionFields';

export const createPatch = (repositories: Repositories): KanjiQuestionsService['patch'] => {
  return async (id, data): Promise<KanjiQuestionPatchResponse> => {
    const existing = await repositories.wordMaster.get(id);
    if (!existing) {
      throw new ApiError('Not Found', 404, ['not_found']);
    }

    const question = String(existing.question ?? '').trim();
    const answer = String(existing.answer ?? '').trim();
    if (!question || !answer) {
      throw new ApiError('question/answer is missing', 400, ['invalid_request']);
    }

    const nextReading = data.readingHiragana ?? existing.readingHiragana;
    const nextUnderline = data.underlineSpec ?? existing.underlineSpec;
    if (!nextReading || !nextUnderline) {
      throw new ApiError('readingHiragana and underlineSpec are required', 400, ['invalid_request']);
    }

    const validated = validateKanjiQuestionFields({
      question,
      readingHiragana: nextReading,
      underlineSpec: nextUnderline as unknown as { type: string; start: number; length: number },
    });

    const updated = await repositories.wordMaster.updateKanjiQuestionFields(id, {
      readingHiragana: validated.readingHiragana,
      underlineSpec: validated.underlineSpec,
    });

    if (!updated) {
      throw new ApiError('Not Found', 404, ['not_found']);
    }

    return toKanjiQuestion(updated);
  };
};
