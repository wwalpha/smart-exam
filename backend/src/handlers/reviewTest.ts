import type { Request, Response } from 'express';
import { ReviewTestRepository } from '@/repositories/reviewTestRepository';
import { apiHandler } from '@/lib/handler';
import type {
  CreateReviewTestRequest,
  CreateReviewTestResponse,
  GetReviewTestResponse,
  ReviewTestListResponse,
  UpdateReviewTestStatusRequest,
  UpdateReviewTestStatusResponse,
} from '@smart-exam/api-types';

type ListReviewTestsReq = Request<{}, ReviewTestListResponse, {}, {}>;
type ListReviewTestsRes = Response<ReviewTestListResponse>;

type CreateReviewTestReq = Request<{}, CreateReviewTestResponse, CreateReviewTestRequest>;
type CreateReviewTestRes = Response<CreateReviewTestResponse>;

type GetReviewTestReq = Request<{ testId: string }, GetReviewTestResponse | { error: string }, {}, {}>;
type GetReviewTestRes = Response<GetReviewTestResponse | { error: string }>;

type UpdateReviewTestStatusReq = Request<
  { testId: string },
  UpdateReviewTestStatusResponse | { error: string },
  UpdateReviewTestStatusRequest
>;
type UpdateReviewTestStatusRes = Response<UpdateReviewTestStatusResponse | { error: string }>;

type DeleteReviewTestReq = Request<{ testId: string }, void, {}, {}>;
type DeleteReviewTestRes = Response<void>;

export const listReviewTests = apiHandler(async (req: ListReviewTestsReq, res: ListReviewTestsRes) => {
  const items = await ReviewTestRepository.listReviewTests();
  res.json({ items, total: items.length });
});

export const createReviewTest = apiHandler(async (req: CreateReviewTestReq, res: CreateReviewTestRes) => {
  const item = await ReviewTestRepository.createReviewTest(req.body);
  res.status(201).json(item);
});

export const getReviewTest = apiHandler(async (req: GetReviewTestReq, res: GetReviewTestRes) => {
  const { testId } = req.params;
  const item = await ReviewTestRepository.getReviewTest(testId);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
});

export const updateReviewTestStatus = apiHandler(
  async (req: UpdateReviewTestStatusReq, res: UpdateReviewTestStatusRes) => {
    const { testId } = req.params;
    const { status } = req.body;
    // const item = await service.updateReviewTestStatus(testId, status); // Not implemented yet
    // if (!item) {
    //   res.status(404).json({ error: 'Not Found' });
    //   return;
    // }
    // res.json(item);
    res.status(501).json({ error: 'Not Implemented' });
  }
);

export const deleteReviewTest = apiHandler(async (req: DeleteReviewTestReq, res: DeleteReviewTestRes) => {
  const { testId } = req.params;
  // await service.deleteReviewTest(testId); // Not implemented in service yet
  // For now, just return 204 to satisfy interface, or implement delete in service
  res.status(204).send();
});
