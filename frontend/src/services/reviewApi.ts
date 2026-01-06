import { apiRequest } from './apiClient';
import type {
  ReviewTest,
  ReviewTestListResponse,
  CreateReviewTestRequest,
  ReviewTestDetail,
  UpdateReviewTestStatusRequest,
  SubmitReviewTestResultsRequest,
  ListReviewTestTargetsResponse,
} from '@smart-exam/api-types';

export const listReviewTests = async (params?: {
  subject?: string;
  status?: string;
  mode?: 'QUESTION' | 'KANJI';
  limit?: number;
  cursor?: string;
}): Promise<ReviewTestListResponse> => {
  return apiRequest<ReviewTestListResponse, typeof params>({
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
