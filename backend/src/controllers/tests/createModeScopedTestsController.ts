import type {
  CreateReviewTestRequest,
  CreateReviewTestResponse,
  ListReviewTestTargetsResponse,
  ReviewMode,
  SearchReviewTestsRequest,
  SearchReviewTestsResponse,
  SubjectId,
  SubmitReviewTestResultsParams,
  SubmitReviewTestResultsRequest,
  UpdateReviewTestStatusParams,
  UpdateReviewTestStatusRequest,
  UpdateReviewTestStatusResponse,
} from '@smart-exam/api-types';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody, ValidatedQuery } from '@/types/express';
import type { Services } from '@/services/createServices';

import {
  CreateTestBodySchema,
  ListTestTargetsQuerySchema,
  SearchTestsBodySchema,
} from './testController.schema';
import { SubmitReviewTestResultsBodySchema } from '@/controllers/exam/submitExamResultsController.schema';
import { UpdateReviewTestStatusBodySchema } from '@/controllers/exam/updateExamStatusController.schema';

export const createModeScopedTestsController = (services: Services, mode: ReviewMode) => {
  const ensureModeMatched = async (testId: string): Promise<boolean> => {
    const item = await services.reviewTests.getExam(testId);
    if (!item) return false;
    return item.mode === mode;
  };

  const listTests: AsyncHandler<ParamsDictionary, { items: unknown[]; total: number }, Record<string, never>, ParsedQs> =
    async (_req, res) => {
      const items = await services.reviewTests.listExams();
      const filtered = items.filter((item) => item.mode === mode);
      res.json({ items: filtered, total: filtered.length });
    };

  const searchTests: AsyncHandler<
    ParamsDictionary,
    SearchReviewTestsResponse,
    SearchReviewTestsRequest,
    ParsedQs
  > = async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchTestsBodySchema>;

    const result = await services.reviewTests.searchExams({
      ...body,
      mode,
    });

    res.json(result);
  };

  const createTest: AsyncHandler<ParamsDictionary, CreateReviewTestResponse, CreateReviewTestRequest, ParsedQs> = async (
    req,
    res,
  ) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateTestBodySchema>;
    const item = await services.reviewTests.createExam({
      ...body,
      mode,
    });
    res.status(201).json(item);
  };

  const listTestTargets: AsyncHandler<
    ParamsDictionary,
    ListReviewTestTargetsResponse,
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const q = (req.validated?.query ?? req.query) as ValidatedQuery<typeof ListTestTargetsQuerySchema>;

    const items = await services.reviewTests.listExamTargets({
      mode,
      fromYmd: q.from,
      toYmd: q.to,
      subject: q.subject as SubjectId | undefined,
    });

    res.json({ items });
  };

  const getTest: AsyncHandler<{ testId: string }, { error: string } | unknown, Record<string, never>, ParsedQs> = async (
    req,
    res,
  ) => {
    const { testId } = req.params;
    const item = await services.reviewTests.getExam(testId);
    if (!item || item.mode !== mode) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };

  const getTestPdf: AsyncHandler<{ testId: string }, { url: string } | { error: string }, Record<string, never>, ParsedQs> =
    async (req, res) => {
      const { testId } = req.params;
      const matched = await ensureModeMatched(testId);
      if (!matched) {
        res.status(404).json({ error: 'Not Found' });
        return;
      }

      const direct = String(req.query.direct ?? '') === '1' || String(req.query.direct ?? '') === 'true';
      const download = String(req.query.download ?? '') === '1' || String(req.query.download ?? '') === 'true';
      const includeGenerated =
        String(req.query.includeGenerated ?? '') === '1' || String(req.query.includeGenerated ?? '') === 'true';

      if (direct) {
        const pdf = await services.reviewTests.generateExamPdfBuffer(testId, { includeGenerated });
        if (!pdf) {
          res.status(404).json({ error: 'Not Found' });
          return;
        }

        const filename = `test-${testId}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${filename}"`);
        res.status(200).end(pdf);
        return;
      }

      const result = await services.reviewTests.getExamPdfUrl(testId, { download });
      if (!result) {
        res.status(404).json({ error: 'Not Found' });
        return;
      }
      res.json(result);
    };

  const updateTestStatus: AsyncHandler<
    UpdateReviewTestStatusParams,
    UpdateReviewTestStatusResponse | { error: string },
    UpdateReviewTestStatusRequest,
    ParsedQs
  > = async (req, res) => {
    const { testId } = req.params;
    const matched = await ensureModeMatched(testId);
    if (!matched) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof UpdateReviewTestStatusBodySchema>;
    const item = await services.reviewTests.updateExamStatus(testId, body);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };

  const deleteTest: AsyncHandler<{ testId: string }, void | { error: string }, Record<string, never>, ParsedQs> = async (
    req,
    res,
  ) => {
    const { testId } = req.params;
    const matched = await ensureModeMatched(testId);
    if (!matched) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    await services.reviewTests.deleteExam(testId);
    res.status(204).send();
  };

  const submitTestResults: AsyncHandler<
    SubmitReviewTestResultsParams,
    void | { error: string },
    SubmitReviewTestResultsRequest,
    ParsedQs
  > = async (req, res) => {
    const { testId } = req.params;
    const matched = await ensureModeMatched(testId);
    if (!matched) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SubmitReviewTestResultsBodySchema>;
    const ok = await services.reviewTests.submitExamResults(testId, body);
    if (!ok) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.status(204).send();
  };

  return {
    CreateTestBodySchema,
    SearchTestsBodySchema,
    ListTestTargetsQuerySchema,
    UpdateReviewTestStatusBodySchema,
    SubmitReviewTestResultsBodySchema,
    listTests,
    searchTests,
    createTest,
    listTestTargets,
    getTest,
    getTestPdf,
    updateTestStatus,
    deleteTest,
    submitTestResults,
  };
};
