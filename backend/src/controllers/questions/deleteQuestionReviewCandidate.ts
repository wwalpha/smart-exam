import { QuestionRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type {
  DeleteQuestionReviewCandidateParams,
  DeleteQuestionReviewCandidateRequest,
  DeleteQuestionReviewCandidateResponse,
} from '@smart-exam/api-types';

export const deleteQuestionReviewCandidate: AsyncHandler<
  DeleteQuestionReviewCandidateParams,
  DeleteQuestionReviewCandidateResponse | { error: string },
  DeleteQuestionReviewCandidateRequest,
  ParsedQs
> = async (req, res) => {
  const { questionId } = req.params;
  const ok = await QuestionRepository.markQuestionCorrect(questionId);
  if (!ok) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json({ ok: true });
};
