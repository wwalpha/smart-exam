import { QuestionRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type {
  CreateQuestionRequest,
  CreateQuestionResponse,
  CreateQuestionParams,
  DeleteQuestionParams,
  DeleteQuestionResponse,
  ListQuestionsParams,
  UpdateQuestionParams,
  QuestionListResponse,
  SearchQuestionsRequest,
  SearchQuestionsResponse,
  UpdateQuestionRequest,
  UpdateQuestionResponse,
} from '@smart-exam/api-types';

export const searchQuestions: AsyncHandler<{}, SearchQuestionsResponse, SearchQuestionsRequest, ParsedQs> = async (
  req,
  res
) => {
  const { keyword, subject } = req.body ?? {};
  const items = await QuestionRepository.searchQuestions({
    keyword,
    subject,
  });
  res.json({ datas: items });
};

export const listQuestions: AsyncHandler<ListQuestionsParams, QuestionListResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const { materialId } = req.params;
  const items = await QuestionRepository.listQuestions(materialId);
  res.json({ datas: items });
};

export const createQuestion: AsyncHandler<
  CreateQuestionParams,
  CreateQuestionResponse,
  CreateQuestionRequest,
  ParsedQs
> = async (req, res) => {
  const { materialId } = req.params;
  const item = await QuestionRepository.createQuestion({
    ...req.body,
    materialId: materialId,
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

export const deleteQuestion: AsyncHandler<DeleteQuestionParams, DeleteQuestionResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const { questionId } = req.params;
  await QuestionRepository.deleteQuestion(questionId);
  res.status(204).end();
};
