// Module: verifyKanjiQuestionController responsibilities.

import type { AsyncHandler } from '@/lib/handler';

import type { KanjiQuestionVerifyResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

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
