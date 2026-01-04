import { Request, Response } from 'express';
import { ExamResultsRepository } from '@/repositories/examRepository';
import { apiHandler } from '@/lib/handler';
import { ExamResult, ListExamResultsResponse, CreateExamResultRequest } from '@smart-exam/api-types';

type ListExamResultsRequest = Request<{}, ListExamResultsResponse, {}, {}>;
type CreateExamResultResponse = Response<ExamResult>;
type CreateExamResultReq = Request<{}, ExamResult, CreateExamResultRequest>;

export const listExamResults = apiHandler(async (req: ListExamResultsRequest, res: Response<ListExamResultsResponse>) => {
  const results = await ExamResultsRepository.listExamResults();
  res.json({ datas: results });
});

export const createExamResult = apiHandler(async (req: CreateExamResultReq, res: CreateExamResultResponse) => {
  const result = await ExamResultsRepository.createExamResult(req.body);
  res.json(result);
});
