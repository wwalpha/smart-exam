import { AttemptsRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type {
  CreateAttemptParams,
  GetLatestAttemptParams,
  SubmitAttemptParams,
  CreateAttemptRequest,
  CreateAttemptResponse,
  GetLatestAttemptResponse,
  SubmitAttemptRequest,
  SubmitAttemptResponse,
} from '@smart-exam/api-types';

export const createAttempt: AsyncHandler<
  CreateAttemptParams,
  CreateAttemptResponse,
  CreateAttemptRequest,
  ParsedQs
> = async (req, res) => {
  const { testId } = req.params;
  const { subjectId } = req.body;
  const item = await AttemptsRepository.createAttempt(testId, subjectId);
  res.status(201).json(item);
};

export const submitAttempt: AsyncHandler<
  SubmitAttemptParams,
  SubmitAttemptResponse | { error: string },
  SubmitAttemptRequest,
  ParsedQs
> = async (req, res) => {
  const { attemptId } = req.params;
  const { results } = req.body;
  const item = await AttemptsRepository.submitAttempt(attemptId, results);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};

export const getLatestAttempt: AsyncHandler<
  GetLatestAttemptParams,
  GetLatestAttemptResponse | { error: string },
  {},
  ParsedQs
> = async (req, res) => {
  const { testId } = req.params;
  const item = await AttemptsRepository.getLatestAttempt(testId);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};
