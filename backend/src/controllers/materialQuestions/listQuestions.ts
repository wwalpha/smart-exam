import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';

import type { ListQuestionsParams, QuestionListResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const listQuestions = (
  services: Services,
): AsyncHandler<ListQuestionsParams, QuestionListResponse, Record<string, never>, ParsedQs> => {
  return async (req, res) => {
    const { materialId } = req.params;
    const items = await services.materialQuestions.listQuestions(materialId);
    res.json({ datas: items });
  };
};
