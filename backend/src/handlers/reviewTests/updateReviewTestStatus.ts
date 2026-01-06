import { ReviewTestRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type {
  UpdateReviewTestStatusParams,
  UpdateReviewTestStatusRequest,
  UpdateReviewTestStatusResponse,
} from '@smart-exam/api-types';

export const updateReviewTestStatus: AsyncHandler<
  UpdateReviewTestStatusParams,
  UpdateReviewTestStatusResponse | { error: string },
  UpdateReviewTestStatusRequest,
  ParsedQs
> = async (req, res) => {
  const { testId } = req.params;
  const { status } = req.body;
  const item = await ReviewTestRepository.updateReviewTestStatus(testId, { status });
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};
