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
  if (request.name) {
    formData.append('name', request.name);
  }
  if (request.sourceId) {
    formData.append('sourceId', request.sourceId);
  }
  if (request.gradedAnswerSheet) {
    formData.append('gradedAnswerSheet', request.gradedAnswerSheet);
  }
  if (request.questionPaper) {
    formData.append('questionPaper', request.questionPaper);
  }
  if (request.answerKey) {
    formData.append('answerKey', request.answerKey);
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
