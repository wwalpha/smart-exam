import { ReviewTestRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { ReviewTestListResponse } from '@smart-exam/api-types';

export const listReviewTests: AsyncHandler<{}, ReviewTestListResponse, {}, ParsedQs> = async (_req, res) => {
  const items = await ReviewTestRepository.listReviewTests();
  res.json({ items, total: items.length });
};
