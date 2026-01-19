import { QuestionRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type {
  UpsertQuestionReviewCandidateParams,
  UpsertQuestionReviewCandidateRequest,
  UpsertQuestionReviewCandidateResponse,
} from '@smart-exam/api-types';

export const upsertQuestionReviewCandidate: AsyncHandler<
  UpsertQuestionReviewCandidateParams,
  UpsertQuestionReviewCandidateResponse | { error: string },
  UpsertQuestionReviewCandidateRequest,
  ParsedQs
> = async (req, res) => {
  const { questionId } = req.params;
  const ok = await QuestionRepository.markQuestionIncorrect(questionId);
  if (!ok) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json({ ok: true });
};
