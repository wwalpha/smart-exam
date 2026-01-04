import { Request, Response } from 'express';
import { ExamPapersRepository } from '@/repositories/examRepository';
import { apiHandler } from '@/lib/handler';
import { ExamPaper, ListExamPapersResponse, CreateExamPaperRequest } from '@smart-exam/api-types';

type ListExamPapersRequest = Request<{}, ListExamPapersResponse, {}, {}>;
type CreateExamPaperResponse = Response<ExamPaper>;
type CreateExamPaperReq = Request<{}, ExamPaper, CreateExamPaperRequest>;

export const listExamPapers = apiHandler(async (req: ListExamPapersRequest, res: Response<ListExamPapersResponse>) => {
  const papers = await ExamPapersRepository.listExamPapers();
  res.json({ datas: papers });
});

export const createExamPaper = apiHandler(async (req: CreateExamPaperReq, res: CreateExamPaperResponse) => {
  const paper = await ExamPapersRepository.createExamPaper(req.body);
  res.json(paper);
});
