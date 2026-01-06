import { ReviewTestRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { DeleteReviewTestParams } from '@smart-exam/api-types';

export const deleteReviewTest: AsyncHandler<DeleteReviewTestParams, void, {}, ParsedQs> = async (req, res) => {
  const { testId } = req.params;
  await ReviewTestRepository.deleteReviewTest(testId);
  res.status(204).send();
};
