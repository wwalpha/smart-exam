import type { Request, Response } from 'express';
import { ExamResultsRepository } from '@/repositories/examRepository';
import { apiHandler } from '@/lib/handler';
import type { CreateExamResultRequest, CreateExamResultResponse, ListExamResultsResponse } from '@smart-exam/api-types';

type ListExamResultsReq = Request<{}, ListExamResultsResponse, {}, {}>;
type ListExamResultsRes = Response<ListExamResultsResponse>;

type CreateExamResultReq = Request<{}, CreateExamResultResponse, CreateExamResultRequest>;
type CreateExamResultRes = Response<CreateExamResultResponse>;

export const listExamResults = apiHandler(async (req: ListExamResultsReq, res: ListExamResultsRes) => {
  const results = await ExamResultsRepository.listExamResults();
  res.json({ datas: results });
});

export const createExamResult = apiHandler(async (req: CreateExamResultReq, res: CreateExamResultRes) => {
  const result = await ExamResultsRepository.createExamResult(req.body);
  res.json(result);
});
