import type {
  ApplyWordTestGradingRequest,
  ApplyWordTestGradingResponse,
  CreateWordTestRequest,
  CreateWordTestResponse,
  GetWordTestDetailRequest,
  GetWordTestDetailResponse,
  ListWordTestsRequest,
  ListWordTestsResponse,
} from '@smart-exam/api-types';
import { apiRequest } from '@/services/apiClient';

export const listWordTests = async (request?: ListWordTestsRequest): Promise<ListWordTestsResponse> => {
  void request;
  return apiRequest<ListWordTestsResponse>({
    method: 'GET',
    path: '/api/wordtests',
  });
};

export const getWordTest = async (request: GetWordTestDetailRequest): Promise<GetWordTestDetailResponse> => {
  return apiRequest<GetWordTestDetailResponse>({
    method: 'GET',
    path: `/api/wordtests/${request.wordTestId}`,
  });
};

export const createWordTest = async (request: CreateWordTestRequest): Promise<CreateWordTestResponse> => {
  const formData = new FormData();
  formData.append('subject', request.subject);
  formData.append('count', request.count.toString());
  if (request.graded_answer_sheet) {
    formData.append('graded_answer_sheet', request.graded_answer_sheet);
  }
  if (request.question_paper) {
    formData.append('question_paper', request.question_paper);
  }
  if (request.answer_key) {
    formData.append('answer_key', request.answer_key);
  }

  return apiRequest<CreateWordTestResponse, FormData>({
    method: 'POST',
    path: '/api/wordtests',
    body: formData,
  });
};

export const applyWordTestGrading = async (
  wordTestId: string,
  request: ApplyWordTestGradingRequest
): Promise<ApplyWordTestGradingResponse> => {
  return apiRequest<ApplyWordTestGradingResponse, ApplyWordTestGradingRequest>({
    method: 'POST',
    path: `/api/wordtests/${wordTestId}/grading`,
    body: request,
  });
};
