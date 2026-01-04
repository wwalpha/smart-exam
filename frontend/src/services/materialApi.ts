import { apiRequest } from './apiClient';
import type {
  MaterialSet,
  MaterialSetListResponse,
  CreateMaterialSetRequest,
  UpdateMaterialSetRequest,
  MaterialFile,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
} from '@smart-exam/api-types';

export const listMaterialSets = async (params?: {
  subject?: string;
  grade?: string;
  provider?: string;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
  cursor?: string;
}): Promise<MaterialSetListResponse> => {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, String(value));
    });
  }
  return apiRequest<MaterialSetListResponse>({
    method: 'GET',
    path: `/api/material-sets?${query.toString()}`,
  });
};

export const createMaterialSet = async (request: CreateMaterialSetRequest): Promise<MaterialSet> => {
  return apiRequest<MaterialSet, CreateMaterialSetRequest>({
    method: 'POST',
    path: '/api/material-sets',
    body: request,
  });
};

export const getMaterialSet = async (materialSetId: string): Promise<MaterialSet> => {
  return apiRequest<MaterialSet>({
    method: 'GET',
    path: `/api/material-sets/${materialSetId}`,
  });
};

export const updateMaterialSet = async (
  materialSetId: string,
  request: UpdateMaterialSetRequest
): Promise<MaterialSet> => {
  return apiRequest<MaterialSet, UpdateMaterialSetRequest>({
    method: 'PATCH',
    path: `/api/material-sets/${materialSetId}`,
    body: request,
  });
};

export const listMaterialFiles = async (materialSetId: string): Promise<MaterialFile[]> => {
  return apiRequest<MaterialFile[]>({
    method: 'GET',
    path: `/api/material-sets/${materialSetId}/files`,
  });
};

export const listQuestions = async (materialSetId: string): Promise<Question[]> => {
  return apiRequest<Question[]>({
    method: 'GET',
    path: `/api/material-sets/${materialSetId}/questions`,
  });
};

export const createQuestion = async (
  materialSetId: string,
  request: CreateQuestionRequest
): Promise<Question> => {
  return apiRequest<Question, CreateQuestionRequest>({
    method: 'POST',
    path: `/api/material-sets/${materialSetId}/questions`,
    body: request,
  });
};

export const updateQuestion = async (
  questionId: string,
  request: UpdateQuestionRequest
): Promise<Question> => {
  return apiRequest<Question, UpdateQuestionRequest>({
    method: 'PATCH',
    path: `/api/questions/${questionId}`,
    body: request,
  });
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
  return apiRequest<void>({
    method: 'DELETE',
    path: `/api/questions/${questionId}`,
  });
};
