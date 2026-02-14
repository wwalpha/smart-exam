// Module: updateReviewTestStatusController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParsedQs } from 'qs';

import type {
  UpdateReviewTestStatusParams,
  UpdateReviewTestStatusRequest,
  UpdateReviewTestStatusResponse,
} from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { UpdateReviewTestStatusBodySchema } from './updateReviewTestStatusController.schema';

/** Creates update review test status controller. */
export const updateReviewTestStatusController = (services: Services) => {
  const updateReviewTestStatus: AsyncHandler<
    UpdateReviewTestStatusParams,
    UpdateReviewTestStatusResponse | { error: string },
    UpdateReviewTestStatusRequest,
    ParsedQs
  > = async (req, res) => {
    const { testId } = req.params;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof UpdateReviewTestStatusBodySchema>;
    const item = await services.reviewTests.updateReviewTestStatus(testId, body);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };

  return { UpdateReviewTestStatusBodySchema, updateReviewTestStatus };
};
