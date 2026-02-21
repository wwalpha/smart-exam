import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';

import type { DeleteQuestionParams, DeleteQuestionResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const deleteQuestion = (
  services: Services,
): AsyncHandler<DeleteQuestionParams, DeleteQuestionResponse | { error: string }, Record<string, never>, ParsedQs> => {
  return async (req, res) => {
    const { materialId, questionId } = req.params;

    const deleted = await services.materialQuestions.deleteQuestion(materialId, questionId);
    if (!deleted) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.status(204).send();
  };
};
