import type { Request, Response } from 'express';
import { AttemptsRepository } from '@/repositories/attemptRepository';
import { apiHandler } from '@/lib/handler';
import type {
  CreateAttemptRequest,
  CreateAttemptResponse,
  GetLatestAttemptResponse,
  SubmitAttemptRequest,
  SubmitAttemptResponse,
} from '@smart-exam/api-types';

type CreateAttemptReq = Request<{ testId: string }, CreateAttemptResponse, CreateAttemptRequest>;
type CreateAttemptRes = Response<CreateAttemptResponse>;

type SubmitAttemptReq = Request<{ attemptId: string }, SubmitAttemptResponse | { error: string }, SubmitAttemptRequest>;
type SubmitAttemptRes = Response<SubmitAttemptResponse | { error: string }>;

type GetLatestAttemptReq = Request<{ testId: string }, GetLatestAttemptResponse | { error: string }, {}, {}>;
type GetLatestAttemptRes = Response<GetLatestAttemptResponse | { error: string }>;

export const createAttempt = apiHandler(
  async (req: CreateAttemptReq, res: CreateAttemptRes) => {
    const { testId } = req.params;
    const { subjectId } = req.body;
    const item = await AttemptsRepository.createAttempt(testId, subjectId);
    res.status(201).json(item);
  }
);

export const submitAttempt = apiHandler(
  async (req: SubmitAttemptReq, res: SubmitAttemptRes) => {
    const { attemptId } = req.params;
    const { results } = req.body;
    const item = await AttemptsRepository.submitAttempt(attemptId, results);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  }
);

export const getLatestAttempt = apiHandler(
  async (req: GetLatestAttemptReq, res: GetLatestAttemptRes) => {
    const { testId } = req.params;
    const item = await AttemptsRepository.getLatestAttempt(testId);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  }
);
