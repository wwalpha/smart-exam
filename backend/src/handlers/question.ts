import { QuestionRepository } from '@/repositories/questionRepository';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type {
  CreateQuestionRequest,
  CreateQuestionResponse,
  CreateQuestionParams,
  ListQuestionsParams,
  UpdateQuestionParams,
  QuestionListResponse,
  UpdateQuestionRequest,
  UpdateQuestionResponse,
} from '@smart-exam/api-types';

export const listQuestions: AsyncHandler<ListQuestionsParams, QuestionListResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const { materialSetId } = req.params;
  const items = await QuestionRepository.listQuestions(materialSetId);
  res.json({ datas: items });
};

export const createQuestion: AsyncHandler<
  CreateQuestionParams,
  CreateQuestionResponse,
  CreateQuestionRequest,
  ParsedQs
> = async (req, res) => {
  const { materialSetId } = req.params;
  const item = await QuestionRepository.createQuestion({
    ...req.body,
    materialSetId,
  });
  res.status(201).json(item);
};

export const updateQuestion: AsyncHandler<
  UpdateQuestionParams,
  UpdateQuestionResponse | { error: string },
  UpdateQuestionRequest,
  ParsedQs
> = async (req, res) => {
  const { questionId } = req.params;
  const item = await QuestionRepository.updateQuestion(questionId, req.body);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};
