// Module: listReviewTestTargetsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedQuery } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { ListReviewTestTargetsResponse, SubjectId } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { ListReviewTestTargetsQuerySchema } from './listReviewTestTargetsController.schema';

/** Creates list review test targets controller. */
export const listReviewTestTargetsController = (services: Services) => {
  const listReviewTestTargets: AsyncHandler<
    ParamsDictionary,
    ListReviewTestTargetsResponse,
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const q = (req.validated?.query ?? req.query) as ValidatedQuery<typeof ListReviewTestTargetsQuerySchema>;

    const items = await services.reviewTests.listReviewTestTargets({
      mode: q.mode,
      fromYmd: q.from,
      toYmd: q.to,
      subject: q.subject as SubjectId | undefined,
    });

    res.json({ items });
  };

  return { ListReviewTestTargetsQuerySchema, listReviewTestTargets };
};
