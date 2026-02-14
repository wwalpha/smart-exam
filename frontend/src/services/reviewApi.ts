import { apiRequest } from './apiClient';
import type {
  Exam,
  ReviewMode,
  ExamListResponse,
  CreateExamRequest,
  ExamDetail,
  UpdateExamStatusRequest,
  SearchExamsRequest,
  SubmitExamResultsRequest,
  ListExamTargetsResponse,
  ListExamCandidatesResponse,
} from '@smart-exam/api-types';

const toModeSegment = (mode: ReviewMode): 'kanji' | 'question' => (mode === 'KANJI' ? 'kanji' : 'question');

export const listExams = async (params: SearchExamsRequest): Promise<ExamListResponse> => {
  const path = params.mode === 'KANJI' ? '/api/exam/kanji/search' : '/api/exam/question/search';

  return apiRequest<ExamListResponse, SearchExamsRequest>({
    method: 'POST',
    path,
    body: params,
  });
};

export const createExam = async (request: CreateExamRequest): Promise<Exam> => {
  const path = request.mode === 'KANJI' ? '/api/exam/kanji' : '/api/exam/question';

  return apiRequest<Exam, CreateExamRequest>({
    method: 'POST',
    path,
    body: request,
  });
};

export const getExam = async (testId: string): Promise<ExamDetail> => {
  return getExamByMode(testId, 'QUESTION');
};

export const getExamByMode = async (testId: string, mode: ReviewMode): Promise<ExamDetail> => {
  return apiRequest<ExamDetail>({
    method: 'GET',
    path: `/api/exam/${toModeSegment(mode)}/${testId}`,
  });
};

export const updateExamStatus = async (
  testId: string,
  request: UpdateExamStatusRequest
): Promise<Exam> => {
  return updateExamStatusByMode(testId, request, 'QUESTION');
};

export const updateExamStatusByMode = async (
  testId: string,
  request: UpdateExamStatusRequest,
  mode: ReviewMode
): Promise<Exam> => {
  return apiRequest<Exam, UpdateExamStatusRequest>({
    method: 'PATCH',
    path: `/api/exam/${toModeSegment(mode)}/${testId}`,
    body: request,
  });
};

export const deleteExam = async (testId: string): Promise<void> => {
  return deleteExamByMode(testId, 'QUESTION');
};

export const deleteExamByMode = async (testId: string, mode: ReviewMode): Promise<void> => {
  return apiRequest<void>({
    method: 'DELETE',
    path: `/api/exam/${toModeSegment(mode)}/${testId}`,
  });
};

export const submitExamResults = async (
  testId: string,
  request: SubmitExamResultsRequest
): Promise<void> => {
  return submitExamResultsByMode(testId, request, 'QUESTION');
};

export const submitExamResultsByMode = async (
  testId: string,
  request: SubmitExamResultsRequest,
  mode: ReviewMode
): Promise<void> => {
  return apiRequest<void, SubmitExamResultsRequest>({
    method: 'POST',
    path: `/api/exam/${toModeSegment(mode)}/${testId}/results`,
    body: request,
  });
};

export const listExamTargets = async (params: {
  mode: 'QUESTION' | 'KANJI';
  from: string;
  to: string;
  subject?: string;
}): Promise<ListExamTargetsResponse> => {
  const qs = new URLSearchParams({
    from: params.from,
    to: params.to,
    ...(params.subject ? { subject: params.subject } : {}),
  });

  const path = params.mode === 'KANJI' ? '/api/exam/kanji/targets' : '/api/exam/question/targets';

  return apiRequest<ListExamTargetsResponse>({
    method: 'GET',
    path: `${path}?${qs.toString()}`,
  });
};

export const listExamCandidates = async (params?: {
  subject?: string;
  mode?: 'QUESTION' | 'KANJI';
}): Promise<ListExamCandidatesResponse> => {
  const qs = new URLSearchParams({
    ...(params?.subject ? { subject: params.subject } : {}),
    ...(params?.mode ? { mode: params.mode } : {}),
  });

  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  return apiRequest<ListExamCandidatesResponse>({
    method: 'GET',
    path: `/api/review-test-candidates${suffix}`,
  });
};
