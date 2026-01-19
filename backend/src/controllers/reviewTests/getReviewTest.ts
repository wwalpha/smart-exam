import { ReviewTestRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { GetReviewTestParams, GetReviewTestResponse } from '@smart-exam/api-types';

export const getReviewTest: AsyncHandler<
  GetReviewTestParams,
  GetReviewTestResponse | { error: string },
  {},
  ParsedQs
> = async (req, res) => {
  const { testId } = req.params;
  const item = await ReviewTestRepository.getReviewTest(testId);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};
