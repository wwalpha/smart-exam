import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { CreateQuestionParams, CreateQuestionRequest, CreateQuestionResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { CreateQuestionBodySchema } from './materialQuestions.schema';

export const createQuestion = (
  services: Services,
): AsyncHandler<CreateQuestionParams, CreateQuestionResponse, CreateQuestionRequest, ParsedQs> => {
  return async (req, res) => {
    const { materialId } = req.params;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateQuestionBodySchema>;

    const item = await services.materialQuestions.createQuestion({
      ...body,
      materialId,
    });
    res.status(201).json(item);
  };
};
