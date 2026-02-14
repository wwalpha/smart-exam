// Module: patchKanjiQuestionController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { KanjiQuestionPatchRequest, KanjiQuestionPatchResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { PatchKanjiQuestionBodySchema } from './patchKanjiQuestionController.schema';

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
