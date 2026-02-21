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

const toModeSegment = (mode: ExamMode): 'kanji' | 'material' => (mode === 'KANJI' ? 'kanji' : 'material');

export const listExams = async (params: SearchExamsRequest): Promise<ExamListResponse> => {
  const path = params.mode === 'KANJI' ? '/api/exam/kanji/search' : '/api/exam/material/search';

  return apiRequest<ExamListResponse, SearchExamsRequest>({
    method: 'POST',
    path,
    body: params,
  });
};

export const createExam = async (request: CreateExamRequest): Promise<Exam> => {
  const path = request.mode === 'KANJI' ? '/api/exam/kanji' : '/api/exam/material';

  return apiRequest<Exam, CreateExamRequest>({
    method: 'POST',
    path,
    body: request,
  });
};

export const getExam = async (examId: string): Promise<ExamDetail> => {
  return getExamByMode(examId, 'MATERIAL');
};

export const getExamByMode = async (examId: string, mode: ExamMode): Promise<ExamDetail> => {
  return apiRequest<ExamDetail>({
    method: 'GET',
    path: `/api/exam/${toModeSegment(mode)}/${examId}`,
  });
};

export const updateExamStatus = async (examId: string, request: UpdateExamStatusRequest): Promise<Exam> => {
  return updateExamStatusByMode(examId, request, 'MATERIAL');
};

export const updateExamStatusByMode = async (
  examId: string,
  request: UpdateExamStatusRequest,
  mode: ExamMode,
): Promise<Exam> => {
  return apiRequest<Exam, UpdateExamStatusRequest>({
    method: 'PATCH',
    path: `/api/exam/${toModeSegment(mode)}/${examId}`,
    body: request,
  });
};

export const deleteExam = async (examId: string): Promise<void> => {
  return deleteExamByMode(examId, 'MATERIAL');
};

export const deleteExamByMode = async (examId: string, mode: ExamMode): Promise<void> => {
  return apiRequest<void>({
    method: 'DELETE',
    path: `/api/exam/${toModeSegment(mode)}/${examId}`,
  });
};

export const submitExamResults = async (examId: string, request: SubmitExamResultsRequest): Promise<void> => {
  return submitExamResultsByMode(examId, request, 'MATERIAL');
};

export const submitExamResultsByMode = async (
  examId: string,
  request: SubmitExamResultsRequest,
  mode: ExamMode,
): Promise<void> => {
  return apiRequest<void, SubmitExamResultsRequest>({
    method: 'POST',
    path: `/api/exam/${toModeSegment(mode)}/${examId}/results`,
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
    from: params.from,
    to: params.to,
    ...(params.subject ? { subject: params.subject } : {}),
  });

  const path = params.mode === 'KANJI' ? '/api/exam/kanji/targets' : '/api/exam/material/targets';

  return apiRequest<ListExamTargetsResponse>({
    method: 'GET',
    path: `${path}?${qs.toString()}`,
  });
};

export const completeExam = async (examId: string): Promise<void> => {
  return apiRequest<void>({
    method: 'POST',
    path: `/api/exam/${examId}/completion`,
  });
};
