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

export const listReviewTests: AsyncHandler<{}, ReviewTestListResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const items = await ReviewTestRepository.listReviewTests();
  res.json({ items, total: items.length });
};

export const searchReviewTests: AsyncHandler<{}, SearchReviewTestsResponse, SearchReviewTestsRequest, ParsedQs> = async (
  req,
  res
) => {
  const items = await ReviewTestRepository.listReviewTests();
  const filtered = items.filter((x) => {
    if (req.body?.mode && x.mode !== req.body.mode) return false;
    if (req.body?.subject && req.body.subject !== 'ALL' && x.subject !== (req.body.subject as any)) return false;
    if (req.body?.status && req.body.status !== 'ALL' && x.status !== (req.body.status as any)) return false;
    return true;
  });

  res.json({ items: filtered, total: filtered.length });
};

export const createReviewTest: AsyncHandler<
  {},
  CreateReviewTestResponse,
  CreateReviewTestRequest,
  ParsedQs
> = async (req, res) => {
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

export const getReviewTestPdf: AsyncHandler<
  GetReviewTestPdfParams,
  Buffer | { error: string },
  {},
  ParsedQs
> = async (req, res) => {
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
