import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';

import type {
  UpsertQuestionReviewCandidateParams,
  UpsertQuestionReviewCandidateRequest,
  UpsertQuestionReviewCandidateResponse,
} from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const upsertQuestionReviewCandidate = (
  services: Services,
): AsyncHandler<
  UpsertQuestionReviewCandidateParams,
  UpsertQuestionReviewCandidateResponse | { error: string },
  UpsertQuestionReviewCandidateRequest,
  ParsedQs
> => {
  return async (req, res) => {
    const { questionId } = req.params;
    const ok = await services.materialQuestions.markQuestionIncorrect(questionId);
    if (!ok) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json({ ok: true });
  };
};
