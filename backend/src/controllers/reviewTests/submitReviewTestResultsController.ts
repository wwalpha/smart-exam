// Module: submitReviewTestResultsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { SubmitReviewTestResultsParams, SubmitReviewTestResultsRequest } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { SubmitReviewTestResultsBodySchema } from './submitReviewTestResultsController.schema';

/** Creates submit review test results controller. */
export const submitReviewTestResultsController = (services: Services) => {
  const submitReviewTestResults: AsyncHandler<
    SubmitReviewTestResultsParams,
    void | { error: string },
    SubmitReviewTestResultsRequest,
    ParsedQs
  > = async (req, res) => {
    const { testId } = req.params;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SubmitReviewTestResultsBodySchema>;

    const ok = await services.reviewTests.submitReviewTestResults(testId, body);
    if (!ok) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    res.status(204).send();
  };

  return { SubmitReviewTestResultsBodySchema, submitReviewTestResults };
};
