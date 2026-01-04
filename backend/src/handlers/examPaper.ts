import type { Request, Response } from 'express';
import { ExamPapersRepository } from '@/repositories/examRepository';
import { apiHandler } from '@/lib/handler';
import type { CreateExamPaperRequest, CreateExamPaperResponse, ListExamPapersResponse } from '@smart-exam/api-types';

type ListExamPapersReq = Request<{}, ListExamPapersResponse, {}, {}>;
type ListExamPapersRes = Response<ListExamPapersResponse>;

type CreateExamPaperReq = Request<{}, CreateExamPaperResponse, CreateExamPaperRequest>;
type CreateExamPaperRes = Response<CreateExamPaperResponse>;

export const listExamPapers = apiHandler(async (req: ListExamPapersReq, res: ListExamPapersRes) => {
  const papers = await ExamPapersRepository.listExamPapers();
  res.json({ datas: papers });
});

export const createExamPaper = apiHandler(async (req: CreateExamPaperReq, res: CreateExamPaperRes) => {
  const paper = await ExamPapersRepository.createExamPaper(req.body);
  res.json(paper);
});
