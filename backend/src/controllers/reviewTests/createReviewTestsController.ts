import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody, ValidatedQuery } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { z } from 'zod';

import { REVIEW_MODE } from '@smart-exam/api-types';
import type {
  CreateReviewTestRequest,
  CreateReviewTestResponse,
  DeleteReviewTestParams,
  GetReviewTestParams,
  GetReviewTestResponse,
  ListReviewTestCandidatesResponse,
  ListReviewTestTargetsResponse,
  ReviewMode,
  SearchReviewTestsRequest,
  SearchReviewTestsResponse,
  SubmitReviewTestResultsParams,
  SubmitReviewTestResultsRequest,
  SubjectId,
  UpdateReviewTestStatusParams,
  UpdateReviewTestStatusRequest,
  UpdateReviewTestStatusResponse,
} from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { SubjectIdSchema } from '@/lib/zodSchemas';
import type { Services } from '@/services/createServices';

const ReviewModeSchema = z.enum([REVIEW_MODE.QUESTION, REVIEW_MODE.KANJI]);

const queryString = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string());
const queryStringOptional = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

export const createReviewTestsController = (services: Services) => {
  const SearchReviewTestsBodySchema = z.object({
    subject: z.union([z.literal('ALL'), SubjectIdSchema]),
    mode: ReviewModeSchema,
    status: z.union([z.literal('ALL'), z.literal('IN_PROGRESS'), z.literal('COMPLETED')]).optional(),
    limit: z.number().int().positive().optional(),
    cursor: z.string().optional(),
  });

  const CreateReviewTestBodySchema = z.object({
    subject: SubjectIdSchema,
    count: z.number().int().positive(),
    mode: ReviewModeSchema,
    days: z.number().int().positive().optional(),
    rangeFrom: z.string().optional(),
    rangeTo: z.string().optional(),
    includeCorrect: z.boolean().optional(),
  });

  const UpdateReviewTestStatusBodySchema = z.object({
    status: z.enum(['IN_PROGRESS', 'COMPLETED']),
  });

  const SubmitReviewTestResultsBodySchema = z.object({
    results: z.array(
      z.object({
        id: z.string().min(1),
        isCorrect: z.boolean(),
      }),
    ),
    date: z.string().optional(),
  });

  const ListReviewTestTargetsQuerySchema = z.object({
    mode: queryString().pipe(ReviewModeSchema),
    from: queryString().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
    to: queryString().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }),
    subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
  });

  const ListReviewTestCandidatesQuerySchema = z.object({
    subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
    mode: queryStringOptional().pipe(ReviewModeSchema.optional()),
  });

  const listReviewTests: AsyncHandler<
    ParamsDictionary,
    { items: unknown[]; total: number },
    Record<string, never>,
    ParsedQs
  > = async (_req, res) => {
    const items = await services.reviewTests.listReviewTests();
    res.json({ items, total: items.length });
  };

  const searchReviewTests: AsyncHandler<
    ParamsDictionary,
    SearchReviewTestsResponse,
    SearchReviewTestsRequest,
    ParsedQs
  > = async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchReviewTestsBodySchema>;
    const result = await services.reviewTests.searchReviewTests(body);
    res.json(result);
  };

  const createReviewTest: AsyncHandler<
    ParamsDictionary,
    CreateReviewTestResponse,
    CreateReviewTestRequest,
    ParsedQs
  > = async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateReviewTestBodySchema>;
    const item = await services.reviewTests.createReviewTest(body);
    res.status(201).json(item);
  };

  const getReviewTest: AsyncHandler<
    GetReviewTestParams,
    GetReviewTestResponse | { error: string },
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const { testId } = req.params;
    const item = await services.reviewTests.getReviewTest(testId);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };

  const getReviewTestPdf: AsyncHandler<
    { testId: string },
    { url: string } | { error: string },
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const { testId } = req.params;

    const direct = String(req.query.direct ?? '') === '1' || String(req.query.direct ?? '') === 'true';
    const download = String(req.query.download ?? '') === '1' || String(req.query.download ?? '') === 'true';

    // ローカル検証用: S3 / presign を経由せずにPDFを直接返す
    if (direct) {
      const pdf = await services.reviewTests.generateReviewTestPdfBuffer(testId);
      if (!pdf) {
        res.status(404).json({ error: 'Not Found' });
        return;
      }

      const filename = `review-test-${testId}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${filename}"`);
      res.status(200).send(pdf);
      return;
    }

    const result = await services.reviewTests.getReviewTestPdfUrl(testId, { download });
    if (!result) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(result);
  };

  const updateReviewTestStatus: AsyncHandler<
    UpdateReviewTestStatusParams,
    UpdateReviewTestStatusResponse | { error: string },
    UpdateReviewTestStatusRequest,
    ParsedQs
  > = async (req, res) => {
    const { testId } = req.params;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof UpdateReviewTestStatusBodySchema>;
    const item = await services.reviewTests.updateReviewTestStatus(testId, body);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };

  const deleteReviewTest: AsyncHandler<DeleteReviewTestParams, void, Record<string, never>, ParsedQs> = async (
    req,
    res,
  ) => {
    const { testId } = req.params;
    await services.reviewTests.deleteReviewTest(testId);
    res.status(204).send();
  };

  const submitReviewTestResults: AsyncHandler<
    SubmitReviewTestResultsParams,
    void | { error: string },
    SubmitReviewTestResultsRequest,
    ParsedQs
  > = async (req, res) => {
    const { testId } = req.params;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SubmitReviewTestResultsBodySchema>;

    const ok = await services.reviewTests.submitReviewTestResults(testId, body);
    if (!ok) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    res.status(204).send();
  };

  const listReviewTestTargets: AsyncHandler<
    ParamsDictionary,
    ListReviewTestTargetsResponse,
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const q = (req.validated?.query ?? req.query) as ValidatedQuery<typeof ListReviewTestTargetsQuerySchema>;

    const items = await services.reviewTests.listReviewTestTargets({
      mode: q.mode,
      fromYmd: q.from,
      toYmd: q.to,
      subject: q.subject as SubjectId | undefined,
    });

    res.json({ items });
  };

  const listReviewTestCandidates: AsyncHandler<
    ParamsDictionary,
    ListReviewTestCandidatesResponse,
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const q = (req.validated?.query ?? req.query) as ValidatedQuery<typeof ListReviewTestCandidatesQuerySchema>;

    const items = await services.reviewTests.listReviewTestCandidates({
      subject: q.subject as SubjectId | undefined,
      mode: q.mode as ReviewMode | undefined,
    });

    res.json({
      items: items.map((x) => ({
        id: x.id,
        subject: x.subject,
        targetId: x.questionId,
        mode: x.mode,
        correctCount: typeof x.correctCount === 'number' ? x.correctCount : 0,
        nextTime: x.nextTime,
        ...(x.testId ? { testId: x.testId } : {}),
      })),
    });
  };

  return {
    SearchReviewTestsBodySchema,
    CreateReviewTestBodySchema,
    UpdateReviewTestStatusBodySchema,
    SubmitReviewTestResultsBodySchema,
    ListReviewTestTargetsQuerySchema,
    ListReviewTestCandidatesQuerySchema,
    listReviewTests,
    searchReviewTests,
    createReviewTest,
    getReviewTest,
    getReviewTestPdf,
    updateReviewTestStatus,
    deleteReviewTest,
    submitReviewTestResults,
    listReviewTestTargets,
    listReviewTestCandidates,
  };
};
