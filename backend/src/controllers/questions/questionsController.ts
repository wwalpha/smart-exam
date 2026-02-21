// Module: questionsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParsedQs } from 'qs';
import type { ParamsDictionary } from 'express-serve-static-core';

import type {
  CreateQuestionParams,
  CreateQuestionRequest,
  CreateQuestionResponse,
  DeleteQuestionParams,
  DeleteQuestionResponse,
  DeleteQuestionReviewCandidateParams,
  DeleteQuestionReviewCandidateRequest,
  DeleteQuestionReviewCandidateResponse,
  ListQuestionsParams,
  QuestionListResponse,
  SearchQuestionsRequest,
  SearchQuestionsResponse,
  UpdateQuestionParams,
  UpdateQuestionRequest,
  UpdateQuestionResponse,
  UpsertQuestionReviewCandidateParams,
  UpsertQuestionReviewCandidateRequest,
  UpsertQuestionReviewCandidateResponse,
} from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { CreateQuestionBodySchema, SearchQuestionsBodySchema, UpdateQuestionBodySchema } from './questions.schema';

/** Creates questions controller. */
export const questionsController = (services: Services) => {
  const listQuestions: AsyncHandler<
    ListQuestionsParams,
    QuestionListResponse,
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const { materialId } = req.params;
    const items = await services.questions.listQuestions(materialId);
    res.json({ datas: items });
  };

  const createQuestion: AsyncHandler<
    CreateQuestionParams,
    CreateQuestionResponse,
    CreateQuestionRequest,
    ParsedQs
  > = async (req, res) => {
    const { materialId } = req.params;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateQuestionBodySchema>;
    const item = await services.questions.createQuestion({
      ...body,
      materialId,
    });
    res.status(201).json(item);
  };

  const updateQuestion: AsyncHandler<
    UpdateQuestionParams,
    UpdateQuestionResponse | { error: string },
    UpdateQuestionRequest,
    ParsedQs
  > = async (req, res) => {
    const { questionId } = req.params;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof UpdateQuestionBodySchema>;
    const item = await services.questions.updateQuestion(questionId, body);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };

  const searchQuestions: AsyncHandler<
    ParamsDictionary,
    SearchQuestionsResponse,
    SearchQuestionsRequest,
    ParsedQs
  > = async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchQuestionsBodySchema>;
    const items = await services.questions.searchQuestions({ keyword: body.keyword, subject: body.subject });
    res.json({ datas: items });
  };

  const deleteQuestion: AsyncHandler<
    DeleteQuestionParams,
    DeleteQuestionResponse | { error: string },
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const { questionId } = req.params;
    const deleted = await services.questions.deleteQuestion(questionId);
    if (!deleted) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.status(204).send();
  };

  const upsertQuestionReviewCandidate: AsyncHandler<
    UpsertQuestionReviewCandidateParams,
    UpsertQuestionReviewCandidateResponse | { error: string },
    UpsertQuestionReviewCandidateRequest,
    ParsedQs
  > = async (req, res) => {
    const { questionId } = req.params;
    const ok = await services.questions.markQuestionIncorrect(questionId);
    if (!ok) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json({ ok: true });
  };

  const deleteQuestionReviewCandidate: AsyncHandler<
    DeleteQuestionReviewCandidateParams,
    DeleteQuestionReviewCandidateResponse | { error: string },
    DeleteQuestionReviewCandidateRequest,
    ParsedQs
  > = async (req, res) => {
    const { questionId } = req.params;
    const ok = await services.questions.markQuestionCorrect(questionId);
    if (!ok) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json({ ok: true });
  };

  return {
    SearchQuestionsBodySchema,
    CreateQuestionBodySchema,
    UpdateQuestionBodySchema,
    searchQuestions,
    listQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    upsertQuestionReviewCandidate,
    deleteQuestionReviewCandidate,
  };
};
