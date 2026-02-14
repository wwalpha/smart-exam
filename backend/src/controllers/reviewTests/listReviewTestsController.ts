// Module: listReviewTestsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { Services } from '@/services/createServices';

/** Creates list review tests controller. */
export const listReviewTestsController = (services: Services) => {
  const listReviewTests: AsyncHandler<
    ParamsDictionary,
    { items: unknown[]; total: number },
    Record<string, never>,
    ParsedQs
  > = async (_req, res) => {
    const items = await services.reviewTests.listReviewTests();
    res.json({ items, total: items.length });
  };

  return { listReviewTests };
};
