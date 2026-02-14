import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedParams } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { DeleteExamParams } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { DeleteExamParamsSchema } from './deleteExamController.schema';

/** Creates delete review test controller. */
export const deleteExamController = (services: Services) => {
  const deleteExam: AsyncHandler<DeleteExamParams, void, Record<string, never>, ParsedQs> = async (req, res) => {
    const { testId } = (req.validated?.params ?? req.params) as ValidatedParams<typeof DeleteExamParamsSchema>;
    await services.exams.deleteExam(testId);
    res.status(204).send();
  };

  return { DeleteExamParamsSchema, deleteExam };
};
