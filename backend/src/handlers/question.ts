import { Request, Response } from 'express';
import { QuestionRepository } from '@/repositories/questionRepository';
import { apiHandler } from '@/lib/handler';
import { CreateQuestionRequest, UpdateQuestionRequest, QuestionListResponse, Question } from '@smart-exam/api-types';

type ListQuestionsRequest = Request<{ materialSetId: string }, QuestionListResponse, {}, {}>;
type CreateQuestionReq = Request<{ materialSetId: string }, Question, Omit<CreateQuestionRequest, 'materialSetId'>>;
type UpdateQuestionReq = Request<{ questionId: string }, Question | { error: string }, UpdateQuestionRequest>;

export const listQuestions = apiHandler(async (req: ListQuestionsRequest, res: Response<QuestionListResponse>) => {
  const { materialSetId } = req.params;
  const items = await QuestionRepository.listQuestions(materialSetId);
  res.json({ datas: items });
});

export const createQuestion = apiHandler(async (req: CreateQuestionReq, res: Response<Question>) => {
  const { materialSetId } = req.params;
  const item = await QuestionRepository.createQuestion({
    ...req.body,
    materialSetId,
  });
  res.status(201).json(item);
});

export const updateQuestion = apiHandler(
  async (req: UpdateQuestionReq, res: Response<Question | { error: string }>) => {
    const { questionId } = req.params;
    const item = await QuestionRepository.updateQuestion(questionId, req.body);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  }
);
