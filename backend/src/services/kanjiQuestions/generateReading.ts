import type { KanjiQuestionGenerateReadingResponse } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiQuestionsService } from './createKanjiQuestionsService';
import { validateKanjiQuestionFields } from './validateKanjiQuestionFields';

export const createGenerateReading = (repositories: Repositories): KanjiQuestionsService['generateReading'] => {
  return async (id): Promise<KanjiQuestionGenerateReadingResponse> => {
    const existing = await repositories.wordMaster.get(id);
    if (!existing) {
      throw new ApiError('Not Found', 404, ['not_found']);
    }

    const question = String(existing.question ?? '').trim();
    const answer = String(existing.answer ?? '').trim();
    if (!question || !answer) {
      throw new ApiError('question/answer is missing', 400, ['invalid_request']);
    }

    const modelId = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';

    const errors: string[] = [];
    // 最大2回リトライ = 最大3回試行
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const hint =
          errors.length > 0
            ? `Previous validation error: ${errors[errors.length - 1]}. Fix JSON accordingly.`
            : undefined;

        const generated = await repositories.bedrock.generateKanjiQuestionReading({
          question,
          answer,
          modelId,
          hint,
        });

        const readingHiragana = String(generated.readingHiragana ?? '').trim();

        const underlineSpec = generated.underlineSpec
          ? (generated.underlineSpec as unknown as { type: string; start: number; length: number })
          : (() => {
              const startIndex = question.indexOf(readingHiragana);
              if (startIndex < 0) {
                throw new Error('readingHiragana is not found in question');
              }
              return { type: 'promptSpan', start: startIndex, length: readingHiragana.length };
            })();

        const validated = validateKanjiQuestionFields({ question, readingHiragana, underlineSpec });

        await repositories.wordMaster.updateKanjiQuestionFields(id, {
          readingHiragana: validated.readingHiragana,
          underlineSpec: validated.underlineSpec,
        });

        return {
          id,
          readingHiragana: validated.readingHiragana,
          underlineSpec: validated.underlineSpec,
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        errors.push(message);

        if (attempt < 2) continue;

        throw new ApiError(message, 500, ['generate_reading_failed']);
      }
    }

    // unreachable
    throw new Error('Unexpected');
  };
};
