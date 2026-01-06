import { apiRequest } from './apiClient';
import type {
  MaterialSet,
  MaterialSetListResponse,
  SearchMaterialSetsRequest,
  CreateMaterialSetRequest,
  UpdateMaterialSetRequest,
  MaterialFile,
  ListMaterialFilesResponse,
  Question,
  QuestionListResponse,
  CreateQuestionRequest,
  UpdateQuestionRequest,
} from '@smart-exam/api-types';

export const listMaterialSets = async (params?: SearchMaterialSetsRequest): Promise<MaterialSetListResponse> => {
  return apiRequest<MaterialSetListResponse, SearchMaterialSetsRequest>({
    method: 'POST',
    path: '/api/materials/search',
    body: params ?? {},
  });
};

export const createMaterialSet = async (request: CreateMaterialSetRequest): Promise<MaterialSet> => {
  return apiRequest<MaterialSet, CreateMaterialSetRequest>({
    method: 'POST',
    path: '/api/materials',
    body: request,
  });
};

export const getMaterialSet = async (materialSetId: string): Promise<MaterialSet> => {
  return apiRequest<MaterialSet>({
    method: 'GET',
    path: `/api/materials/${materialSetId}`,
  });
};

export const updateMaterialSet = async (
  materialSetId: string,
  request: UpdateMaterialSetRequest
): Promise<MaterialSet> => {
  return apiRequest<MaterialSet, UpdateMaterialSetRequest>({
    method: 'PATCH',
    path: `/api/materials/${materialSetId}`,
    body: request,
  });
};

export const deleteMaterialSet = async (materialSetId: string): Promise<void> => {
  return apiRequest<void>({
    method: 'DELETE',
    path: `/api/materials/${materialSetId}`,
  });
};

export const listMaterialFiles = async (materialSetId: string): Promise<MaterialFile[]> => {
  const response = await apiRequest<ListMaterialFilesResponse>({
    method: 'GET',
    path: `/api/materials/${materialSetId}/files`,
  });

  return response.datas;
};

export const listQuestions = async (materialSetId: string): Promise<Question[]> => {
  const response = await apiRequest<QuestionListResponse>({
    method: 'GET',
    path: `/api/materials/${materialSetId}/questions`,
  });

  return response.datas;
};

export const createQuestion = async (
  materialSetId: string,
  request: CreateQuestionRequest
): Promise<Question> => {
  return apiRequest<Question, CreateQuestionRequest>({
    method: 'POST',
    path: `/api/materials/${materialSetId}/questions`,
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
