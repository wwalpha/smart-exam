// Module: submitExamResultsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody, ValidatedParams } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { SubmitExamResultsParams, SubmitExamResultsRequest } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { SubmitExamResultsBodySchema, SubmitExamResultsParamsSchema } from './submitExamResultsController.schema';

/** Creates submit review test results controller. */
export const submitExamResultsController = (services: Services) => {
  const submitExamResults: AsyncHandler<
    SubmitExamResultsParams,
    void | { error: string },
    SubmitExamResultsRequest,
    ParsedQs
  > = async (req, res) => {
    const { testId } = (req.validated?.params ?? req.params) as ValidatedParams<typeof SubmitExamResultsParamsSchema>;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SubmitExamResultsBodySchema>;

    const ok = await services.exams.submitExamResults(testId, body);
    if (!ok) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    res.status(204).send();
  };

  return { SubmitExamResultsParamsSchema, SubmitExamResultsBodySchema, submitExamResults };
};
