import { apiRequest } from './apiClient';
import type {
  ReviewTest,
  ReviewTestListResponse,
  CreateReviewTestRequest,
  ReviewTestDetail,
  UpdateReviewTestStatusRequest,
  SubmitReviewTestResultsRequest,
} from '@smart-exam/api-types';

export const listReviewTests = async (params?: {
  subject?: string;
  status?: string;
  mode?: 'QUESTION' | 'KANJI';
  limit?: number;
  cursor?: string;
}): Promise<ReviewTestListResponse> => {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, String(value));
    });
  }
  return apiRequest<ReviewTestListResponse>({
    method: 'GET',
    path: `/api/review-tests?${query.toString()}`,
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

export const getReviewTestPdfUrl = async (testId: string, type?: 'QUESTION' | 'ANSWER'): Promise<{ url: string }> => {
  const query = type ? `?type=${type}` : '';
  return apiRequest<{ url: string }>({
    method: 'GET',
    path: `/api/review-tests/${testId}/pdf${query}`,
  });
};
