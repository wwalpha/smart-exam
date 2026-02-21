import { apiRequest } from './apiClient';
import type {
  Exam,
  ExamMode,
  ExamListResponse,
  CreateExamRequest,
  ExamDetail,
  UpdateExamStatusRequest,
  SearchExamsRequest,
  SubmitExamResultsRequest,
  ListExamTargetsResponse,
} from '@smart-exam/api-types';

export const listExams = async (params: SearchExamsRequest): Promise<ExamListResponse> => {
  return apiRequest<ExamListResponse, SearchExamsRequest>({
    method: 'POST',
    path: '/api/exam/search',
    body: params,
  });
};

export const createExam = async (request: CreateExamRequest): Promise<Exam> => {
  return apiRequest<Exam, CreateExamRequest>({
    method: 'POST',
    path: '/api/exam',
    body: request,
  });
};

export const getExam = async (examId: string): Promise<ExamDetail> => {
  return getExamByMode(examId, 'MATERIAL');
};

export const getExamByMode = async (examId: string, mode: ExamMode): Promise<ExamDetail> => {
  void mode;
  return apiRequest<ExamDetail>({
    method: 'GET',
    path: `/api/exam/${examId}`,
  });
};

export const updateExamStatus = async (examId: string, request: UpdateExamStatusRequest): Promise<Exam> => {
  return updateExamStatusByMode(examId, request, 'MATERIAL');
};

export const updateExamStatusByMode = async (
  examId: string,
  request: UpdateExamStatusRequest,
  _mode: ExamMode,
): Promise<Exam> => {
  return apiRequest<Exam, UpdateExamStatusRequest>({
    method: 'PATCH',
    path: `/api/exam/${examId}`,
    body: request,
  });
};

export const deleteExam = async (examId: string): Promise<void> => {
  return deleteExamByMode(examId, 'MATERIAL');
};

export const deleteExamByMode = async (examId: string, _mode: ExamMode): Promise<void> => {
  return apiRequest<void>({
    method: 'DELETE',
    path: `/api/exam/${examId}`,
  });
};

export const submitExamResults = async (examId: string, request: SubmitExamResultsRequest): Promise<void> => {
  return submitExamResultsByMode(examId, request, 'MATERIAL');
};

export const submitExamResultsByMode = async (
  examId: string,
  request: SubmitExamResultsRequest,
  _mode: ExamMode,
): Promise<void> => {
  return apiRequest<void, SubmitExamResultsRequest>({
    method: 'POST',
    path: `/api/exam/${examId}/results`,
    body: request,
  });
};

export const listExamTargets = async (params: {
  mode: 'MATERIAL' | 'KANJI';
  from: string;
  to: string;
  subject?: string;
}): Promise<ListExamTargetsResponse> => {
  const qs = new URLSearchParams({
    mode: params.mode,
    from: params.from,
    to: params.to,
    ...(params.subject ? { subject: params.subject } : {}),
  });

  return apiRequest<ListExamTargetsResponse>({
    method: 'GET',
    path: `/api/exam/targets?${qs.toString()}`,
  });
};

export const completeExam = async (examId: string): Promise<void> => {
  return apiRequest<void>({
    method: 'POST',
    path: `/api/exam/${examId}/completion`,
  });
};
