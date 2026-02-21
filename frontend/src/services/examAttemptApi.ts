import { apiRequest } from './apiClient';
import type {
  ListExamAttemptsResponse,
  UpsertExamAttemptRequest,
  UpsertExamAttemptResponse,
  DeleteExamAttemptRequest,
  DeleteExamAttemptResponse,
} from '@smart-exam/api-types';

export const listReviewAttempts = async (params: {
  targetType: 'MATERIAL' | 'KANJI';
  targetId: string;
}): Promise<ListExamAttemptsResponse> => {
  const qs = new URLSearchParams({ targetType: params.targetType, targetId: params.targetId });
  return apiRequest<ListExamAttemptsResponse>({
    method: 'GET',
    path: `/api/exam-attempts?${qs.toString()}`,
  });
};

export const upsertReviewAttempt = async (request: UpsertExamAttemptRequest): Promise<UpsertExamAttemptResponse> => {
  return apiRequest<UpsertExamAttemptResponse, UpsertExamAttemptRequest>({
    method: 'PUT',
    path: '/api/exam-attempts',
    body: request,
  });
};

export const deleteReviewAttempt = async (request: DeleteExamAttemptRequest): Promise<DeleteExamAttemptResponse> => {
  const qs = new URLSearchParams({
    targetType: request.targetType,
    targetId: request.targetId,
    dateYmd: request.dateYmd,
  });

  return apiRequest<DeleteExamAttemptResponse>({
    method: 'DELETE',
    path: `/api/exam-attempts?${qs.toString()}`,
  });
};
