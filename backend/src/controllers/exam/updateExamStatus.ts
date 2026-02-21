import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody, ValidatedParams } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { UpdateExamStatusParams, UpdateExamStatusRequest, UpdateExamStatusResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { UpdateExamStatusBodySchema, UpdateExamStatusParamsSchema } from './updateExamStatus.schema';

export const updateExamStatus = (
  services: Services,
): AsyncHandler<
  UpdateExamStatusParams,
  UpdateExamStatusResponse | { error: string },
  UpdateExamStatusRequest,
  ParsedQs
> => {
  return async (req, res) => {
    const { examId } = (req.validated?.params ?? req.params) as ValidatedParams<typeof UpdateExamStatusParamsSchema>;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof UpdateExamStatusBodySchema>;
    const item = await services.exams.updateExamStatus(examId, body);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };
};
