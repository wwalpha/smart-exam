import { ReviewTestRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { CreateReviewTestRequest, CreateReviewTestResponse } from '@smart-exam/api-types';

export const createReviewTest: AsyncHandler<{}, CreateReviewTestResponse, CreateReviewTestRequest, ParsedQs> = async (
  req,
  res
) => {
  const item = await ReviewTestRepository.createReviewTest(req.body);
  res.status(201).json(item);
};
