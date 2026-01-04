import { ExamResultsRepository } from '@/repositories/examRepository';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type {
  CreateExamResultRequest,
  CreateExamResultResponse,
  ListExamResultsResponse,
} from '@smart-exam/api-types';

export const listExamResults: AsyncHandler<ParamsDictionary, ListExamResultsResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const results = await ExamResultsRepository.listExamResults();
  res.json({ datas: results });
};

export const createExamResult: AsyncHandler<
  ParamsDictionary,
  CreateExamResultResponse,
  CreateExamResultRequest,
  ParsedQs
> = async (req, res) => {
  const result = await ExamResultsRepository.createExamResult(req.body);
  res.json(result);
};
