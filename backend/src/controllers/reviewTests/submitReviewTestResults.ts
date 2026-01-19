import { ReviewTestRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { SubmitReviewTestResultsRequest } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';

export const SubmitReviewTestResultsBodySchema = z.object({
  results: z.array(
    z.object({
      id: z.string().min(1),
      isCorrect: z.boolean(),
    })
  ),
  date: z.string().optional(),
});

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
  const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SubmitReviewTestResultsBodySchema>;
  const ok = await ReviewTestRepository.submitReviewTestResults(testId, body);
  if (!ok) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.status(204).send();
};
