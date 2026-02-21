import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedParams } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { GetExamParams, GetExamResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { GetExamParamsSchema } from './getExam.schema';

export const getExam = (
  services: Services,
): AsyncHandler<GetExamParams, GetExamResponse | { error: string }, Record<string, never>, ParsedQs> => {
  return async (req, res) => {
    const { examId } = (req.validated?.params ?? req.params) as ValidatedParams<typeof GetExamParamsSchema>;
    const item = await services.exams.getExam(examId);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };
};
