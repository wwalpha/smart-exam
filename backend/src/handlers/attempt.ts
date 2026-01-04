import { Request, Response } from 'express';
import { AttemptsRepository } from '@/repositories/attemptRepository';
import { apiHandler } from '@/lib/handler';
import { Attempt, CreateAttemptRequest, SubmitAttemptRequest } from '@smart-exam/api-types';

type CreateAttemptReq = Request<{ testId: string }, Attempt, CreateAttemptRequest>;
type SubmitAttemptReq = Request<{ attemptId: string }, Attempt | { error: string }, SubmitAttemptRequest>;
type GetLatestAttemptReq = Request<{ testId: string }, Attempt | { error: string }, {}, {}>;

export const createAttempt = apiHandler(async (req: CreateAttemptReq, res: Response<Attempt>) => {
  const { testId } = req.params;
  const { subjectId } = req.body;
  const item = await AttemptsRepository.createAttempt(testId, subjectId);
  res.status(201).json(item);
});

export const submitAttempt = apiHandler(async (req: SubmitAttemptReq, res: Response<Attempt | { error: string }>) => {
  const { attemptId } = req.params;
  const { results } = req.body;
  const item = await AttemptsRepository.submitAttempt(attemptId, results);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
});

export const getLatestAttempt = apiHandler(
  async (req: GetLatestAttemptReq, res: Response<Attempt | { error: string }>) => {
    const { testId } = req.params;
    const item = await AttemptsRepository.getLatestAttempt(testId);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  }
);
