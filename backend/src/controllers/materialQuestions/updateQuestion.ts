import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { UpdateQuestionParams, UpdateQuestionRequest, UpdateQuestionResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { UpdateQuestionBodySchema } from './materialQuestions.schema';

export const updateQuestion = (
  services: Services,
): AsyncHandler<UpdateQuestionParams, UpdateQuestionResponse | { error: string }, UpdateQuestionRequest, ParsedQs> => {
  return async (req, res) => {
    const { materialId, questionId } = req.params;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof UpdateQuestionBodySchema>;
    const item = await services.materialQuestions.updateQuestion(materialId, questionId, body);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };
};
