import { apiRequest } from './apiClient';
import type {
  ReviewTest,
  ReviewMode,
  ReviewTestListResponse,
  CreateReviewTestRequest,
  ReviewTestDetail,
  UpdateReviewTestStatusRequest,
  SearchReviewTestsRequest,
  SubmitReviewTestResultsRequest,
  ListReviewTestTargetsResponse,
  ListReviewTestCandidatesResponse,
} from '@smart-exam/api-types';

const toModeSegment = (mode: ReviewMode): 'kanji' | 'question' => (mode === 'KANJI' ? 'kanji' : 'question');

export const listReviewTests = async (params: SearchReviewTestsRequest): Promise<ReviewTestListResponse> => {
  const path = params.mode === 'KANJI' ? '/api/exam/kanji/search' : '/api/exam/question/search';

  return apiRequest<ReviewTestListResponse, SearchReviewTestsRequest>({
    method: 'POST',
    path,
    body: params,
  });
};

export const createReviewTest = async (request: CreateReviewTestRequest): Promise<ReviewTest> => {
  const path = request.mode === 'KANJI' ? '/api/exam/kanji' : '/api/exam/question';

  return apiRequest<ReviewTest, CreateReviewTestRequest>({
    method: 'POST',
    path,
    body: request,
  });
};

export const getReviewTest = async (testId: string): Promise<ReviewTestDetail> => {
  return getReviewTestByMode(testId, 'QUESTION');
};

export const getReviewTestByMode = async (testId: string, mode: ReviewMode): Promise<ReviewTestDetail> => {
  return apiRequest<ReviewTestDetail>({
    method: 'GET',
    path: `/api/exam/${toModeSegment(mode)}/${testId}`,
  });
};

export const updateReviewTestStatus = async (
  testId: string,
  request: UpdateReviewTestStatusRequest
): Promise<ReviewTest> => {
  return updateReviewTestStatusByMode(testId, request, 'QUESTION');
};

export const updateReviewTestStatusByMode = async (
  testId: string,
  request: UpdateReviewTestStatusRequest,
  mode: ReviewMode
): Promise<ReviewTest> => {
  return apiRequest<ReviewTest, UpdateReviewTestStatusRequest>({
    method: 'PATCH',
    path: `/api/exam/${toModeSegment(mode)}/${testId}`,
    body: request,
  });
};

export const deleteReviewTest = async (testId: string): Promise<void> => {
  return deleteReviewTestByMode(testId, 'QUESTION');
};

export const deleteReviewTestByMode = async (testId: string, mode: ReviewMode): Promise<void> => {
  return apiRequest<void>({
    method: 'DELETE',
    path: `/api/exam/${toModeSegment(mode)}/${testId}`,
  });
};

export const submitReviewTestResults = async (
  testId: string,
  request: SubmitReviewTestResultsRequest
): Promise<void> => {
  return submitReviewTestResultsByMode(testId, request, 'QUESTION');
};

export const submitReviewTestResultsByMode = async (
  testId: string,
  request: SubmitReviewTestResultsRequest,
  mode: ReviewMode
): Promise<void> => {
  return apiRequest<void, SubmitReviewTestResultsRequest>({
    method: 'POST',
    path: `/api/exam/${toModeSegment(mode)}/${testId}/results`,
    body: request,
  });
};

export const listReviewTestTargets = async (params: {
  mode: 'QUESTION' | 'KANJI';
  from: string;
  to: string;
  subject?: string;
}): Promise<ListReviewTestTargetsResponse> => {
  const qs = new URLSearchParams({
    from: params.from,
    to: params.to,
    ...(params.subject ? { subject: params.subject } : {}),
  });

  const path = params.mode === 'KANJI' ? '/api/exam/kanji/targets' : '/api/exam/question/targets';

  return apiRequest<ListReviewTestTargetsResponse>({
    method: 'GET',
    path: `${path}?${qs.toString()}`,
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
