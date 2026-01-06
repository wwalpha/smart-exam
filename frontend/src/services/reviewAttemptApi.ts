import { apiRequest } from './apiClient';
import type {
  ListReviewAttemptsResponse,
  UpsertReviewAttemptRequest,
  UpsertReviewAttemptResponse,
  DeleteReviewAttemptRequest,
  DeleteReviewAttemptResponse,
} from '@smart-exam/api-types';

export const listReviewAttempts = async (params: {
  targetType: 'QUESTION' | 'KANJI';
  targetId: string;
}): Promise<ListReviewAttemptsResponse> => {
  const qs = new URLSearchParams({ targetType: params.targetType, targetId: params.targetId });
  return apiRequest<ListReviewAttemptsResponse>({
    method: 'GET',
    path: `/api/review-attempts?${qs.toString()}`,
  });
};

export const upsertReviewAttempt = async (
  request: UpsertReviewAttemptRequest
): Promise<UpsertReviewAttemptResponse> => {
  return apiRequest<UpsertReviewAttemptResponse, UpsertReviewAttemptRequest>({
    method: 'PUT',
    path: '/api/review-attempts',
    body: request,
  });
};

export const deleteReviewAttempt = async (
  request: DeleteReviewAttemptRequest
): Promise<DeleteReviewAttemptResponse> => {
  const qs = new URLSearchParams({
    targetType: request.targetType,
    targetId: request.targetId,
    dateYmd: request.dateYmd,
  });

  return apiRequest<DeleteReviewAttemptResponse>({
    method: 'DELETE',
    path: `/api/review-attempts?${qs.toString()}`,
  });
};
