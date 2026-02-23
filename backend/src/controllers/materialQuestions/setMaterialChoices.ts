import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParsedQs } from 'qs';
import type {
  SetMaterialChoicesParams,
  SetMaterialChoicesRequest,
  SetMaterialChoicesResponse,
} from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { SetMaterialChoicesBodySchema } from './materialQuestions.schema';

export const setMaterialChoices = (
  services: Services,
): AsyncHandler<
  SetMaterialChoicesParams,
  SetMaterialChoicesResponse | { error: string },
  SetMaterialChoicesRequest,
  ParsedQs
> => {
  return async (req, res) => {
    const { materialId } = req.params;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SetMaterialChoicesBodySchema>;

    const ok = await services.materialQuestions.setMaterialChoices({
      materialId,
      items: body.items.map((item) => ({
        questionId: item.questionId,
        isCorrect: item.isCorrect,
        correctAnswer: item.correctAnswer,
      })),
    });

    if (!ok) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    res.json({ ok: true });
  };
};