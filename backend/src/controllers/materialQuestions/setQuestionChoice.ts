import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParsedQs } from 'qs';
import type {
  SetQuestionChoiceParams,
  SetQuestionChoiceRequest,
  SetQuestionChoiceResponse,
} from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';
import { SetQuestionChoiceBodySchema } from './materialQuestions.schema';

export const setQuestionChoice = (
  services: Services,
): AsyncHandler<
  SetQuestionChoiceParams,
  SetQuestionChoiceResponse | { error: string },
  SetQuestionChoiceRequest,
  ParsedQs
> => {
  return async (req, res) => {
    const { materialId, questionId } = req.params;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SetQuestionChoiceBodySchema>;
    const ok = await services.materialQuestions.setQuestionChoice({
      materialId,
      questionId,
      isCorrect: body.isCorrect,
    });
    if (!ok) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json({ ok: true });
  };
};
