import { ReviewTestRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { SearchReviewTestsRequest, SearchReviewTestsResponse } from '@smart-exam/api-types';

export const searchReviewTests: AsyncHandler<
  {},
  SearchReviewTestsResponse,
  SearchReviewTestsRequest,
  ParsedQs
> = async (req, res) => {
  if (!req.body?.mode || !req.body?.subject) {
    res.status(400).json({ items: [], total: 0 });
    return;
  }

  const items = await ReviewTestRepository.listReviewTests();
  const filtered = items.filter((x) => {
    if (x.mode !== req.body.mode) return false;
    if (req.body.subject !== 'ALL' && x.subject !== req.body.subject) return false;
    if (req.body.status && req.body.status !== 'ALL' && x.status !== req.body.status) return false;
    return true;
  });

  res.json({ items: filtered, total: filtered.length });
};
