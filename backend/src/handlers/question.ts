import type { Request, Response } from 'express';
import { QuestionRepository } from '@/repositories/questionRepository';
import { apiHandler } from '@/lib/handler';
import type {
  CreateQuestionRequest,
  CreateQuestionResponse,
  QuestionListResponse,
  UpdateQuestionRequest,
  UpdateQuestionResponse,
} from '@smart-exam/api-types';

type ListQuestionsReq = Request<{ materialSetId: string }, QuestionListResponse, {}, {}>;
type ListQuestionsRes = Response<QuestionListResponse>;

type CreateQuestionReq = Request<{ materialSetId: string }, CreateQuestionResponse, CreateQuestionRequest>;
type CreateQuestionRes = Response<CreateQuestionResponse>;

type UpdateQuestionReq = Request<
  { questionId: string },
  UpdateQuestionResponse | { error: string },
  UpdateQuestionRequest
>;
type UpdateQuestionRes = Response<UpdateQuestionResponse | { error: string }>;

export const listQuestions = apiHandler(async (req: ListQuestionsReq, res: ListQuestionsRes) => {
  const { materialSetId } = req.params;
  const items = await QuestionRepository.listQuestions(materialSetId);
  res.json({ datas: items });
});

export const createQuestion = apiHandler(async (req: CreateQuestionReq, res: CreateQuestionRes) => {
  const { materialSetId } = req.params;
  const item = await QuestionRepository.createQuestion({
    ...req.body,
    materialSetId,
  });
  res.status(201).json(item);
});

export const updateQuestion = apiHandler(async (req: UpdateQuestionReq, res: UpdateQuestionRes) => {
  const { questionId } = req.params;
  const item = await QuestionRepository.updateQuestion(questionId, req.body);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
});
