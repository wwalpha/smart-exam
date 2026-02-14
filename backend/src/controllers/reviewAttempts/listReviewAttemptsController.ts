// Module: listReviewAttemptsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedQuery } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { ListReviewAttemptsResponse, ReviewTargetType, SubjectId } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { ListReviewAttemptsQuerySchema } from './listReviewAttemptsController.schema';

/** Creates list review attempts controller. */
export const listReviewAttemptsController = (services: Services) => {
  const listReviewAttempts: AsyncHandler<
    ParamsDictionary,
    ListReviewAttemptsResponse,
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const q = (req.validated?.query ?? req.query) as ValidatedQuery<typeof ListReviewAttemptsQuerySchema>;

    const items = await services.reviewAttempts.listReviewAttempts({
      targetType: q.targetType as ReviewTargetType,
      targetId: q.targetId,
      subject: q.subject as SubjectId | undefined,
    });

    res.json({ items });
  };

  return {
    ListReviewAttemptsQuerySchema,
    listReviewAttempts,
  };
};
