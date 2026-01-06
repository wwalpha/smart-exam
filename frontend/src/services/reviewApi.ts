import { apiRequest } from './apiClient';
import type {
  ReviewTest,
  ReviewTestListResponse,
  CreateReviewTestRequest,
  ReviewTestDetail,
  UpdateReviewTestStatusRequest,
  SearchReviewTestsRequest,
  SubmitReviewTestResultsRequest,
  ListReviewTestTargetsResponse,
  ListReviewTestCandidatesResponse,
} from '@smart-exam/api-types';

export const listReviewTests = async (params: SearchReviewTestsRequest): Promise<ReviewTestListResponse> => {
  return apiRequest<ReviewTestListResponse, SearchReviewTestsRequest>({
    method: 'POST',
    path: '/api/review-tests/search',
    body: params,
  });
};

export const createReviewTest = async (request: CreateReviewTestRequest): Promise<ReviewTest> => {
  return apiRequest<ReviewTest, CreateReviewTestRequest>({
    method: 'POST',
    path: '/api/review-tests',
    body: request,
  });
};

export const getReviewTest = async (testId: string): Promise<ReviewTestDetail> => {
  return apiRequest<ReviewTestDetail>({
    method: 'GET',
    path: `/api/review-tests/${testId}`,
  });
};

export const updateReviewTestStatus = async (
  testId: string,
  request: UpdateReviewTestStatusRequest
): Promise<ReviewTest> => {
  return apiRequest<ReviewTest, UpdateReviewTestStatusRequest>({
    method: 'PATCH',
    path: `/api/review-tests/${testId}`,
    body: request,
  });
};

export const deleteReviewTest = async (testId: string): Promise<void> => {
  return apiRequest<void>({
    method: 'DELETE',
    path: `/api/review-tests/${testId}`,
  });
};

export const submitReviewTestResults = async (
  testId: string,
  request: SubmitReviewTestResultsRequest
): Promise<void> => {
  return apiRequest<void, SubmitReviewTestResultsRequest>({
    method: 'POST',
    path: `/api/review-tests/${testId}/results`,
    body: request,
  });
};

// PDFは /api/review-tests/:testId/pdf (binary) を利用する

export const listReviewTestTargets = async (params: {
  mode: 'QUESTION' | 'KANJI';
  from: string;
  to: string;
  subject?: string;
}): Promise<ListReviewTestTargetsResponse> => {
  const qs = new URLSearchParams({
    mode: params.mode,
    from: params.from,
    to: params.to,
    ...(params.subject ? { subject: params.subject } : {}),
  });

  return apiRequest<ListReviewTestTargetsResponse>({
    method: 'GET',
    path: `/api/review-tests/targets?${qs.toString()}`,
  });
};

export const listReviewTestCandidates = async (params?: {
  subject?: string;
  mode?: 'QUESTION' | 'KANJI';
}): Promise<ListReviewTestCandidatesResponse> => {
  const qs = new URLSearchParams({
    ...(params?.subject ? { subject: params.subject } : {}),
    ...(params?.mode ? { mode: params.mode } : {}),
  });

  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  return apiRequest<ListReviewTestCandidatesResponse>({
    method: 'GET',
    path: `/api/review-test-candidates${suffix}`,
  });
};
