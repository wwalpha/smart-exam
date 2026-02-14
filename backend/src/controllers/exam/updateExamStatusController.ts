// Module: updateExamStatusController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody, ValidatedParams } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { UpdateExamStatusParams, UpdateExamStatusRequest, UpdateExamStatusResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { UpdateExamStatusBodySchema, UpdateExamStatusParamsSchema } from './updateExamStatusController.schema';

/** Creates update review test status controller. */
export const updateExamStatusController = (services: Services) => {
  const updateExamStatus: AsyncHandler<
    UpdateExamStatusParams,
    UpdateExamStatusResponse | { error: string },
    UpdateExamStatusRequest,
    ParsedQs
  > = async (req, res) => {
    const { testId } = (req.validated?.params ?? req.params) as ValidatedParams<typeof UpdateExamStatusParamsSchema>;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof UpdateExamStatusBodySchema>;
    const item = await services.exams.updateExamStatus(testId, body);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };

  return { UpdateExamStatusParamsSchema, UpdateExamStatusBodySchema, updateExamStatus };
};
