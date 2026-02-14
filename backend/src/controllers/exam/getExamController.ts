// Module: getExamController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';

import type { GetExamParams, GetExamResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

/** Creates get review test controller. */
export const getExamController = (services: Services) => {
  const getExam: AsyncHandler<
    GetExamParams,
    GetExamResponse | { error: string },
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const { testId } = req.params;
    const item = await services.exams.getExam(testId);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };

  return { getExam };
};
