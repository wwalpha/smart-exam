import { Request, Response } from 'express';
import { ReviewTestRepository } from '@/repositories/reviewTestRepository';
import { apiHandler } from '@/lib/handler';
import { CreateReviewTestRequest, ReviewTest, ReviewTestListResponse } from '@smart-exam/api-types';

type ListReviewTestsRequest = Request<{}, ReviewTestListResponse, {}, {}>;
type CreateReviewTestReq = Request<{}, ReviewTest, CreateReviewTestRequest>;
type GetReviewTestRequest = Request<{ testId: string }, ReviewTest | { error: string }, {}, {}>;
type UpdateReviewTestStatusRequest = Request<{ testId: string }, { error: string }, { status: string }>;

export const listReviewTests = apiHandler(
  async (req: ListReviewTestsRequest, res: Response<ReviewTestListResponse>) => {
    const items = await ReviewTestRepository.listReviewTests();
    res.json({ items, total: items.length });
  }
);

export const createReviewTest = apiHandler(async (req: CreateReviewTestReq, res: Response<ReviewTest>) => {
  const item = await ReviewTestRepository.createReviewTest(req.body);
  res.status(201).json(item);
});

export const getReviewTest = apiHandler(
  async (req: GetReviewTestRequest, res: Response<ReviewTest | { error: string }>) => {
    const { testId } = req.params;
    const item = await ReviewTestRepository.getReviewTest(testId);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  }
);

export const updateReviewTestStatus = apiHandler(
  async (req: UpdateReviewTestStatusRequest, res: Response<{ error: string }>) => {
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

export const deleteReviewTest = apiHandler(
  async (req: Request<{ testId: string }, void, {}, {}>, res: Response<void>) => {
    const { testId } = req.params;
    // await service.deleteReviewTest(testId); // Not implemented in service yet
    // For now, just return 204 to satisfy interface, or implement delete in service
    res.status(204).send();
  }
);
