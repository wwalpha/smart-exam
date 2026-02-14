// Module: deleteExamController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';

import type { DeleteExamParams } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

/** Creates delete review test controller. */
export const deleteExamController = (services: Services) => {
  const deleteExam: AsyncHandler<DeleteExamParams, void, Record<string, never>, ParsedQs> = async (
    req,
    res,
  ) => {
    const { testId } = req.params;
    await services.exams.deleteExam(testId);
    res.status(204).send();
  };

  return { deleteExam };
};
