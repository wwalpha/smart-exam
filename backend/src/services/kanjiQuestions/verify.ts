import type { KanjiQuestionVerifyResponse } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import { DateUtils } from '@/lib/dateUtils';
import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiQuestionsService } from './createKanjiQuestionsService';
import { toKanjiQuestion } from './toKanjiQuestion';
import { validateKanjiQuestionFields } from './validateKanjiQuestionFields';

export const createVerify = (repositories: Repositories): KanjiQuestionsService['verify'] => {
  return async (id): Promise<KanjiQuestionVerifyResponse> => {
    const existing = await repositories.wordMaster.get(id);
    if (!existing) {
      throw new ApiError('Not Found', 404, ['not_found']);
    }

    const question = String(existing.question ?? '').trim();
    const answer = String(existing.answer ?? '').trim();
    const readingHiragana = String(existing.readingHiragana ?? '').trim();
    const underlineSpec = existing.underlineSpec;

    if (!question || !answer) {
      throw new ApiError('question/answer is missing', 400, ['invalid_request']);
    }
    if (!readingHiragana || !underlineSpec) {
      throw new ApiError('readingHiragana/underlineSpec is missing', 400, ['invalid_request']);
    }

    validateKanjiQuestionFields({
      question,
      readingHiragana,
      underlineSpec: underlineSpec as unknown as { type: string; start: number; length: number },
    });

    const subject = existing.subject as KanjiQuestionVerifyResponse['subject'];
    const open = await repositories.reviewTestCandidates.getLatestOpenCandidateByTargetId({
      subject,
      targetId: id,
    });
    if (!open) {
      await repositories.reviewTestCandidates.createCandidate({
        subject,
        questionId: id,
        mode: 'KANJI',
        nextTime: DateUtils.todayYmd(),
        correctCount: 0,
        status: 'OPEN',
        createdAtIso: DateUtils.now(),
      });
    }

    return toKanjiQuestion(existing);
  };
};
