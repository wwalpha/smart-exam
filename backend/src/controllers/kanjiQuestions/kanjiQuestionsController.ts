import { z } from 'zod';

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type {
  KanjiQuestionGenerateReadingResponse,
  KanjiQuestionPatchRequest,
  KanjiQuestionPatchResponse,
  KanjiQuestionVerifyResponse,
} from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

/** PatchKanjiQuestionBodySchema validates input shape. */
export const PatchKanjiQuestionBodySchema = z.object({
  readingHiragana: z.string().min(1).optional(),
  underlineSpec: z
    .object({
      type: z.literal('promptSpan'),
      start: z.number().int().nonnegative(),
      length: z.number().int().positive(),
    })
    .optional(),
});

/** Creates generate reading controller. */
export const generateReadingController = (services: Services) => {
  const generateReading: AsyncHandler<
    { questionId: string },
    KanjiQuestionGenerateReadingResponse | { error: string },
    ParamsDictionary,
    ParsedQs
  > = async (req, res) => {
    const { questionId } = req.params;
    const result = await services.kanjiQuestions.generateReading(questionId);
    res.json(result);
  };

  return { generateReading };
};

/** Creates patch kanji question controller. */
export const patchKanjiQuestionController = (services: Services) => {
  const patch: AsyncHandler<
    { questionId: string },
    KanjiQuestionPatchResponse | { error: string },
    KanjiQuestionPatchRequest,
    ParsedQs
  > = async (req, res) => {
    const { questionId } = req.params;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof PatchKanjiQuestionBodySchema>;
    const result = await services.kanjiQuestions.patch(questionId, body);
    res.json(result);
  };

  return { PatchKanjiQuestionBodySchema, patch };
};

/** Creates verify kanji question controller. */
export const verifyKanjiQuestionController = (services: Services) => {
  const verify: AsyncHandler<{ questionId: string }, KanjiQuestionVerifyResponse | { error: string }> = async (
    req,
    res,
  ) => {
    const { questionId } = req.params;
    const result = await services.kanjiQuestions.verify(questionId);
    res.json(result);
  };

  return { verify };
};
