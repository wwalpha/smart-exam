import { ReviewTestRepository } from '@/repositories/reviewTestRepository';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type {
  CreateReviewTestRequest,
  CreateReviewTestResponse,
  DeleteReviewTestParams,
  GetReviewTestParams,
  GetReviewTestResponse,
  ReviewTestDetail,
  ReviewTestListResponse,
  UpdateReviewTestStatusRequest,
  UpdateReviewTestStatusParams,
  UpdateReviewTestStatusResponse,
} from '@smart-exam/api-types';

export const listReviewTests: AsyncHandler<{}, ReviewTestListResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const items = await ReviewTestRepository.listReviewTests();
  res.json({ items, total: items.length });
};

export const createReviewTest: AsyncHandler<
  {},
  CreateReviewTestResponse,
  CreateReviewTestRequest,
  ParsedQs
> = async (req, res) => {
  const item = await ReviewTestRepository.createReviewTest(req.body);
  res.status(201).json(item);
};

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
  const detail: ReviewTestDetail = {
    ...item,
    items: [],
  };
  res.json(detail);
};

export const updateReviewTestStatus: AsyncHandler<
  UpdateReviewTestStatusParams,
  UpdateReviewTestStatusResponse | { error: string },
  UpdateReviewTestStatusRequest,
  ParsedQs
> = async (req, res) => {
  const { testId } = req.params;
  const { status } = req.body;
  void testId;
  void status;
  // const item = await service.updateReviewTestStatus(testId, status); // Not implemented yet
  // if (!item) {
  //   res.status(404).json({ error: 'Not Found' });
  //   return;
  // }
  // res.json(item);
  res.status(501).json({ error: 'Not Implemented' });
};

export const deleteReviewTest: AsyncHandler<DeleteReviewTestParams, void, {}, ParsedQs> = async (req, res) => {
  const { testId } = req.params;
  // await service.deleteReviewTest(testId); // Not implemented in service yet
  // For now, just return 204 to satisfy interface, or implement delete in service
  void testId;
  res.status(204).send();
};
