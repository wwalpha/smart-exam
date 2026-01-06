import { ReviewTestRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { SubmitReviewTestResultsRequest } from '@smart-exam/api-types';

type SubmitReviewTestResultsParams = {
  testId: string;
};

export const submitReviewTestResults: AsyncHandler<
  SubmitReviewTestResultsParams,
  void | { error: string },
  SubmitReviewTestResultsRequest,
  ParsedQs
> = async (req, res) => {
  const { testId } = req.params;
  const ok = await ReviewTestRepository.submitReviewTestResults(testId, req.body);
  if (!ok) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.status(204).send();
};
