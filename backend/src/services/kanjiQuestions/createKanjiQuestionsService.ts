import type {
  KanjiQuestion,
  KanjiQuestionGenerateReadingResponse,
  KanjiQuestionPatchRequest,
  KanjiQuestionPatchResponse,
  KanjiQuestionVerifyResponse,
} from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import { DateUtils } from '@/lib/dateUtils';
import type { Repositories } from '@/repositories/createRepositories';

export type KanjiQuestionsService = {
  generateReading: (id: string) => Promise<KanjiQuestionGenerateReadingResponse>;
  patch: (id: string, data: KanjiQuestionPatchRequest) => Promise<KanjiQuestionPatchResponse>;
  verify: (id: string) => Promise<KanjiQuestionVerifyResponse>;
};

const isHiraganaOnly = (s: string): boolean => {
  // ぁ-ゖ: ひらがな、ー: 長音記号
  return /^[ぁ-ゖー]+$/.test(s);
};

export const createKanjiQuestionsService = (repositories: Repositories): KanjiQuestionsService => {
  const toKanjiQuestion = (dbItem: {
    wordId: string;
    subject: string;
    promptText?: string;
    answerKanji?: string;
    readingHiragana?: string;
    underlineSpec?: { type: 'promptSpan'; start: number; length: number };
    status?: 'DRAFT' | 'GENERATED' | 'VERIFIED' | 'ERROR';
    ai?: KanjiQuestion['ai'];
    error?: KanjiQuestion['error'];
  }): KanjiQuestion => {
    return {
      id: dbItem.wordId,
      subject: dbItem.subject as KanjiQuestion['subject'],
      promptText: String(dbItem.promptText ?? ''),
      answerKanji: String(dbItem.answerKanji ?? ''),
      readingHiragana: dbItem.readingHiragana,
      underlineSpec: dbItem.underlineSpec,
      status: dbItem.status,
      ai: dbItem.ai,
      error: dbItem.error,
    };
  };

  const buildValidator = (promptText: string) => {
    return (result: {
      readingHiragana: string;
      underlineSpec: { type: string; start: number; length: number };
    }) => {
      const readingHiragana = String(result.readingHiragana ?? '').trim();
      if (!readingHiragana) throw new Error('readingHiragana is empty');
      if (!isHiraganaOnly(readingHiragana)) throw new Error('readingHiragana must be hiragana only');

      const underlineSpec = result.underlineSpec;
      if (!underlineSpec || underlineSpec.type !== 'promptSpan') {
        throw new Error('underlineSpec.type must be promptSpan');
      }
      if (!Number.isInteger(underlineSpec.start) || !Number.isInteger(underlineSpec.length)) {
        throw new Error('underlineSpec.start/length must be int');
      }
      if (underlineSpec.start < 0 || underlineSpec.length <= 0) {
        throw new Error('underlineSpec.start/length out of range');
      }
      if (underlineSpec.start + underlineSpec.length > promptText.length) {
        throw new Error('underlineSpec out of promptText range');
      }

      const slice = promptText.slice(underlineSpec.start, underlineSpec.start + underlineSpec.length);
      if (slice !== readingHiragana) {
        throw new Error('underlineSpec does not match readingHiragana');
      }

      return {
        readingHiragana,
        underlineSpec: { type: 'promptSpan' as const, start: underlineSpec.start, length: underlineSpec.length },
      };
    };
  };

  const generateReading: KanjiQuestionsService['generateReading'] = async (id) => {
    const existing = await repositories.wordMaster.get(id);
    if (!existing) {
      throw new ApiError('Not Found', 404, ['not_found']);
    }

    const promptText = String(existing.promptText ?? '').trim();
    const answerKanji = String(existing.answerKanji ?? '').trim();
    if (!promptText || !answerKanji) {
      throw new ApiError('promptText/answerKanji is missing', 400, ['invalid_request']);
    }

    const modelId = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';
    const promptVersion = 'kanji-reading-v1';

    const validate = buildValidator(promptText);

    const errors: string[] = [];
    // 最大2回リトライ = 最大3回試行
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const hint =
          errors.length > 0
            ? `Previous validation error: ${errors[errors.length - 1]}. Fix JSON accordingly.`
            : undefined;

        const generated = await repositories.bedrock.generateKanjiQuestionReading({
          promptText,
          answerKanji,
          modelId,
          hint,
        });

        const validated = validate(generated);

        await repositories.wordMaster.updateKanjiQuestionFields(id, {
          readingHiragana: validated.readingHiragana,
          underlineSpec: validated.underlineSpec,
          status: 'GENERATED',
          ai: {
            model: modelId,
            promptVersion,
            generatedAt: DateUtils.now(),
          },
        });

        return {
          id,
          readingHiragana: validated.readingHiragana,
          underlineSpec: validated.underlineSpec,
          status: 'GENERATED',
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        errors.push(message);

        if (attempt < 2) continue;

        await repositories.wordMaster.updateKanjiQuestionFields(id, {
          status: 'ERROR',
          error: {
            code: 'GENERATE_READING_FAILED',
            message,
            at: DateUtils.now(),
          },
          ai: {
            model: modelId,
            promptVersion,
            generatedAt: DateUtils.now(),
          },
        });

        throw new ApiError(message, 500, ['generate_reading_failed']);
      }
    }

    // unreachable
    throw new Error('Unexpected');
  };

  const patch: KanjiQuestionsService['patch'] = async (id, data) => {
    const existing = await repositories.wordMaster.get(id);
    if (!existing) {
      throw new ApiError('Not Found', 404, ['not_found']);
    }

    const promptText = String(existing.promptText ?? '').trim();
    const answerKanji = String(existing.answerKanji ?? '').trim();
    if (!promptText || !answerKanji) {
      throw new ApiError('promptText/answerKanji is missing', 400, ['invalid_request']);
    }

    if (data.status === 'VERIFIED') {
      throw new ApiError('Use verify endpoint to set VERIFIED', 400, ['invalid_request']);
    }

    const nextReading = data.readingHiragana ?? existing.readingHiragana;
    const nextUnderline = data.underlineSpec ?? existing.underlineSpec;
    if (!nextReading || !nextUnderline) {
      throw new ApiError('readingHiragana and underlineSpec are required', 400, ['invalid_request']);
    }

    const validate = buildValidator(promptText);
    const validated = validate({
      readingHiragana: nextReading,
      underlineSpec: nextUnderline as unknown as { type: string; start: number; length: number },
    });

    const fieldsChanged = data.readingHiragana !== undefined || data.underlineSpec !== undefined;
    const nextStatus: KanjiQuestion['status'] =
      data.status ??
      (fieldsChanged ? (existing.status === 'VERIFIED' ? 'GENERATED' : 'GENERATED') : (existing.status ?? 'DRAFT'));

    const updated = await repositories.wordMaster.updateKanjiQuestionFields(id, {
      readingHiragana: validated.readingHiragana,
      underlineSpec: validated.underlineSpec,
      status: nextStatus,
    });

    if (!updated) {
      throw new ApiError('Not Found', 404, ['not_found']);
    }

    return toKanjiQuestion(updated);
  };

  const verify: KanjiQuestionsService['verify'] = async (id) => {
    const existing = await repositories.wordMaster.get(id);
    if (!existing) {
      throw new ApiError('Not Found', 404, ['not_found']);
    }

    const promptText = String(existing.promptText ?? '').trim();
    const answerKanji = String(existing.answerKanji ?? '').trim();
    const readingHiragana = String(existing.readingHiragana ?? '').trim();
    const underlineSpec = existing.underlineSpec;

    if (!promptText || !answerKanji) {
      throw new ApiError('promptText/answerKanji is missing', 400, ['invalid_request']);
    }
    if (!readingHiragana || !underlineSpec) {
      throw new ApiError('readingHiragana/underlineSpec is missing', 400, ['invalid_request']);
    }

    const validate = buildValidator(promptText);
    validate({
      readingHiragana,
      underlineSpec: underlineSpec as unknown as { type: string; start: number; length: number },
    });

    const updated = await repositories.wordMaster.updateKanjiQuestionFields(id, {
      status: 'VERIFIED',
    });

    if (!updated) {
      throw new ApiError('Not Found', 404, ['not_found']);
    }

    const subject = updated.subject as KanjiQuestion['subject'];
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

    return toKanjiQuestion(updated);
  };

  return { generateReading, patch, verify };
};
