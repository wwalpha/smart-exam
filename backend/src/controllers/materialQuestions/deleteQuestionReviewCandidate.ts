import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';

import type {
  DeleteQuestionReviewCandidateParams,
  DeleteQuestionReviewCandidateRequest,
  DeleteQuestionReviewCandidateResponse,
} from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const deleteQuestionReviewCandidate = (
  services: Services,
): AsyncHandler<
  DeleteQuestionReviewCandidateParams,
  DeleteQuestionReviewCandidateResponse | { error: string },
  DeleteQuestionReviewCandidateRequest,
  ParsedQs
> => {
  return async (req, res) => {
    const { questionId } = req.params;
    const ok = await services.materialQuestions.markQuestionCorrect(questionId);
    if (!ok) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json({ ok: true });
  };
};
