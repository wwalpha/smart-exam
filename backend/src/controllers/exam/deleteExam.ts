import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedParams } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { DeleteExamParams } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { DeleteExamParamsSchema } from './deleteExam.schema';

export const deleteExam = (
  services: Services,
): AsyncHandler<DeleteExamParams, void, Record<string, never>, ParsedQs> => {
  return async (req, res) => {
    const { examId } = (req.validated?.params ?? req.params) as ValidatedParams<typeof DeleteExamParamsSchema>;
    await services.exams.deleteExam(examId);
    res.status(204).send();
  };
};
