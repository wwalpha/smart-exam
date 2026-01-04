import { ExamPapersRepository } from '@/repositories/examRepository';
import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type {
  CreateExamPaperRequest,
  CreateExamPaperResponse,
  ListExamPapersResponse,
} from '@smart-exam/api-types';

export const listExamPapers: AsyncHandler<ParamsDictionary, ListExamPapersResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const papers = await ExamPapersRepository.listExamPapers();
  res.json({ datas: papers });
};

export const createExamPaper: AsyncHandler<
  ParamsDictionary,
  CreateExamPaperResponse,
  CreateExamPaperRequest,
  ParsedQs
> = async (req, res) => {
  const paper = await ExamPapersRepository.createExamPaper(req.body);
  res.json(paper);
};
