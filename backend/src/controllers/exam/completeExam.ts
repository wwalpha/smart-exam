import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedParams } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { Services } from '@/services/createServices';

import { CompleteExamParamsSchema } from './completeExam.schema';

export const completeExam = (
  services: Services,
): AsyncHandler<{ examId: string }, void | { error: string }, Record<string, never>, ParsedQs> => {
  return async (req, res) => {
    const { examId } = (req.validated?.params ?? req.params) as ValidatedParams<typeof CompleteExamParamsSchema>;
    const ok = await services.exams.completeExam(examId);
    if (!ok) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.status(204).send();
  };
};
