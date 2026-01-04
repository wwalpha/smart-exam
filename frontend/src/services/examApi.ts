import { apiRequest } from '@/services/apiClient';
import type {
  CreateExamPaperRequest,
  CreateExamResultRequest,
  ExamPaper,
  ExamResult,
  ListExamPapersResponse,
  ListExamResultsResponse,
  GetUploadUrlRequest,
  GetUploadUrlResponse,
} from '@smart-exam/api-types';

export const getUploadUrl = async (fileName: string, contentType: string): Promise<GetUploadUrlResponse> => {
  return apiRequest<GetUploadUrlResponse, GetUploadUrlRequest>({
    method: 'POST',
    path: '/api/upload-url',
    body: { fileName, contentType },
  });
};

export const uploadFileToS3 = async (url: string, file: File): Promise<void> => {
  await fetch(url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
};

export const listExamPapers = async (): Promise<ListExamPapersResponse> => {
  return apiRequest<ListExamPapersResponse>({
    method: 'GET',
    path: '/api/exampapers',
  });
};

export const createExamPaper = async (request: CreateExamPaperRequest): Promise<ExamPaper> => {
  return apiRequest<ExamPaper, CreateExamPaperRequest>({
    method: 'POST',
    path: '/api/exampapers',
    body: request,
  });
};

export const listExamResults = async (): Promise<ListExamResultsResponse> => {
  return apiRequest<ListExamResultsResponse>({
    method: 'GET',
    path: '/api/examresults',
  });
};

export const createExamResult = async (request: CreateExamResultRequest): Promise<ExamResult> => {
  return apiRequest<ExamResult, CreateExamResultRequest>({
    method: 'POST',
    path: '/api/examresults',
    body: request,
  });
};
