import { ReviewTestRepository } from '@/repositories';
import { ReviewTestPdfService } from '@/services/ReviewTestPdfService';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type {
  CreateReviewTestRequest,
  CreateReviewTestResponse,
  DeleteReviewTestParams,
  GetReviewTestParams,
  GetReviewTestResponse,
  ListReviewTestCandidatesResponse,
  ListReviewTestTargetsResponse,
  ReviewTestListResponse,
  SearchReviewTestsRequest,
  SearchReviewTestsResponse,
  SubmitReviewTestResultsRequest,
  UpdateReviewTestStatusRequest,
  UpdateReviewTestStatusParams,
  UpdateReviewTestStatusResponse,
} from '@smart-exam/api-types';

type SubmitReviewTestResultsParams = {
  testId: string;
};

export const listReviewTests: AsyncHandler<{}, ReviewTestListResponse, {}, ParsedQs> = async (req, res) => {
  const items = await ReviewTestRepository.listReviewTests();
  res.json({ items, total: items.length });
};

export const searchReviewTests: AsyncHandler<
  {},
  SearchReviewTestsResponse,
  SearchReviewTestsRequest,
  ParsedQs
> = async (req, res) => {
  if (!req.body?.mode || !req.body?.subject) {
    res.status(400).json({ items: [], total: 0 });
    return;
  }

  const items = await ReviewTestRepository.listReviewTests();
  const filtered = items.filter((x) => {
    if (x.mode !== req.body.mode) return false;
    if (req.body.subject !== 'ALL' && x.subject !== (req.body.subject as any)) return false;
    if (req.body.status && req.body.status !== 'ALL' && x.status !== (req.body.status as any)) return false;
    return true;
  });

  res.json({ items: filtered, total: filtered.length });
};

type ListReviewTestTargetsQuery = {
  mode?: 'QUESTION' | 'KANJI';
  from?: string;
  to?: string;
  subject?: string;
};

type ListReviewTestCandidatesQuery = {
  subject?: string;
  mode?: 'QUESTION' | 'KANJI';
};

export const listReviewTestCandidates: AsyncHandler<{}, ListReviewTestCandidatesResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const q = req.query as unknown as ListReviewTestCandidatesQuery;

  if (q.mode && q.mode !== 'QUESTION' && q.mode !== 'KANJI') {
    res.status(400).json({ items: [] });
    return;
  }

  const items = await ReviewTestRepository.listReviewTestCandidates({
    subject: q.subject as any,
    mode: q.mode,
  });

  res.json({
    items: items.map((x) => ({
      id: x.id,
      subject: x.subject,
      targetId: x.questionId,
      mode: x.mode,
      correctCount: typeof x.correctCount === 'number' ? x.correctCount : 0,
      nextTime: x.nextTime,
      testId: x.testId,
    })),
  });
};

export const listReviewTestTargets: AsyncHandler<{}, ListReviewTestTargetsResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const q = req.query as unknown as ListReviewTestTargetsQuery;
  if (!q.mode || !q.from || !q.to) {
    res.status(400).json({ items: [] });
    return;
  }

  if (q.mode !== 'QUESTION' && q.mode !== 'KANJI') {
    res.status(400).json({ items: [] });
    return;
  }

  // createdDate(YYYY-MM-DD) の単純比較なので、YYYY-MM-DD 形式を前提とする
  const ymdRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!ymdRe.test(q.from) || !ymdRe.test(q.to)) {
    res.status(400).json({ items: [] });
    return;
  }

  const items = await ReviewTestRepository.listReviewTestTargets({
    mode: q.mode,
    fromYmd: q.from,
    toYmd: q.to,
    subject: q.subject,
  });

  res.json({ items });
};

export const createReviewTest: AsyncHandler<{}, CreateReviewTestResponse, CreateReviewTestRequest, ParsedQs> = async (
  req,
  res
) => {
  const item = await ReviewTestRepository.createReviewTest(req.body);
  res.status(201).json(item);
};

export const getReviewTest: AsyncHandler<
  GetReviewTestParams,
  GetReviewTestResponse | { error: string },
  {},
  ParsedQs
> = async (req, res) => {
  const { testId } = req.params;
  const item = await ReviewTestRepository.getReviewTest(testId);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};

export const updateReviewTestStatus: AsyncHandler<
  UpdateReviewTestStatusParams,
  UpdateReviewTestStatusResponse | { error: string },
  UpdateReviewTestStatusRequest,
  ParsedQs
> = async (req, res) => {
  const { testId } = req.params;
  const { status } = req.body;
  const item = await ReviewTestRepository.updateReviewTestStatus(testId, { status });
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};

export const deleteReviewTest: AsyncHandler<DeleteReviewTestParams, void, {}, ParsedQs> = async (req, res) => {
  const { testId } = req.params;
  await ReviewTestRepository.deleteReviewTest(testId);
  res.status(204).send();
};

export const submitReviewTestResults: AsyncHandler<
  SubmitReviewTestResultsParams,
  void | { error: string },
  SubmitReviewTestResultsRequest,
  ParsedQs
> = async (req, res) => {
  const { testId } = req.params;
  const ok = await ReviewTestRepository.submitReviewTestResults(testId, req.body);
  if (!ok) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.status(204).send();
};

type GetReviewTestPdfParams = {
  testId: string;
};

export const getReviewTestPdf: AsyncHandler<GetReviewTestPdfParams, Buffer | { error: string }, {}, ParsedQs> = async (
  req,
  res
) => {
  const { testId } = req.params;
  const review = await ReviewTestRepository.getReviewTest(testId);
  if (!review) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  const pdfBuffer = await ReviewTestPdfService.generatePdfBuffer(review);

  const wantDownload =
    req.query.download === '1' || req.query.download === 'true' || req.query.disposition === 'attachment';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${wantDownload ? 'attachment' : 'inline'}; filename="review-test-${testId}.pdf"`
  );
  res.status(200).send(pdfBuffer);
};
