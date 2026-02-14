// Module: updateExamStatusController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParsedQs } from 'qs';

import type {
  UpdateExamStatusParams,
  UpdateExamStatusRequest,
  UpdateExamStatusResponse,
} from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { UpdateExamStatusBodySchema } from './updateExamStatusController.schema';

/** Creates update review test status controller. */
export const updateExamStatusController = (services: Services) => {
  const updateExamStatus: AsyncHandler<
    UpdateExamStatusParams,
    UpdateExamStatusResponse | { error: string },
    UpdateExamStatusRequest,
    ParsedQs
  > = async (req, res) => {
    const { testId } = req.params;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof UpdateExamStatusBodySchema>;
    const item = await services.exams.updateExamStatus(testId, body);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };

  return { UpdateExamStatusBodySchema, updateExamStatus };
};
