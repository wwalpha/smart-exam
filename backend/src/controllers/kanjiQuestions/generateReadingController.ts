import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { KanjiQuestionGenerateReadingResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

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
