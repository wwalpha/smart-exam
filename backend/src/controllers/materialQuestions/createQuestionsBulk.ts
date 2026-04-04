import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParsedQs } from 'qs';

import type {
  CreateQuestionsBulkParams,
  CreateQuestionsBulkRequest,
  CreateQuestionsBulkResponse,
} from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { CreateQuestionsBulkBodySchema } from './materialQuestions.schema';

export const createQuestionsBulk = (
  services: Services,
): AsyncHandler<CreateQuestionsBulkParams, CreateQuestionsBulkResponse, CreateQuestionsBulkRequest, ParsedQs> => {
  return async (req, res) => {
    const { materialId } = req.params;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateQuestionsBulkBodySchema>;

    const items = await services.materialQuestions.createQuestionsBulk({
      materialId,
      items: body.items,
    });

    res.status(201).json({ datas: items });
  };
};
