// Module: getReviewTestController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';

import type { GetReviewTestParams, GetReviewTestResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

/** Creates get review test controller. */
export const getReviewTestController = (services: Services) => {
  const getReviewTest: AsyncHandler<
    GetReviewTestParams,
    GetReviewTestResponse | { error: string },
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const { testId } = req.params;
    const item = await services.reviewTests.getReviewTest(testId);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };

  return { getReviewTest };
};
