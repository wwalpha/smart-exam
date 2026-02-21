import { apiRequest } from './apiClient';
import type {
  Material,
  MaterialListResponse,
  SearchMaterialsRequest,
  CreateMaterialRequest,
  UpdateMaterialRequest,
  MaterialFile,
  ListMaterialFilesResponse,
  Question,
  QuestionListResponse,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  SetQuestionChoiceRequest,
  SetQuestionChoiceResponse,
  CompleteMaterialRequest,
  CompleteMaterialResponse,
} from '@smart-exam/api-types';

export const listMaterials = async (params?: SearchMaterialsRequest): Promise<MaterialListResponse> => {
  return apiRequest<MaterialListResponse, SearchMaterialsRequest>({
    method: 'POST',
    path: '/api/materials/search',
    body: params ?? {},
  });
};

export const createMaterial = async (request: CreateMaterialRequest): Promise<Material> => {
  return apiRequest<Material, CreateMaterialRequest>({
    method: 'POST',
    path: '/api/materials',
    body: request,
  });
};

export const getMaterial = async (materialId: string): Promise<Material> => {
  return apiRequest<Material>({
    method: 'GET',
    path: `/api/materials/${materialId}`,
  });
};

export const updateMaterial = async (materialId: string, request: UpdateMaterialRequest): Promise<Material> => {
  return apiRequest<Material, UpdateMaterialRequest>({
    method: 'PATCH',
    path: `/api/materials/${materialId}`,
    body: request,
  });
};

export const deleteMaterial = async (materialId: string): Promise<void> => {
  return apiRequest<void>({
    method: 'DELETE',
    path: `/api/materials/${materialId}`,
  });
};

export const completeMaterial = async (materialId: string): Promise<CompleteMaterialResponse> => {
  return apiRequest<CompleteMaterialResponse, CompleteMaterialRequest>({
    method: 'POST',
    path: `/api/materials/${materialId}/completion`,
    body: {},
  });
};

export const listMaterialFiles = async (materialId: string): Promise<MaterialFile[]> => {
  const response = await apiRequest<ListMaterialFilesResponse>({
    method: 'GET',
    path: `/api/materials/${materialId}/files`,
  });

  return response.datas;
};

export const listQuestions = async (materialId: string): Promise<Question[]> => {
  const response = await apiRequest<QuestionListResponse>({
    method: 'GET',
    path: `/api/materials/${materialId}/questions`,
  });

  return response.datas;
};

export const createQuestion = async (
  materialId: string,
  request: CreateQuestionRequest
): Promise<Question> => {
  return apiRequest<Question, CreateQuestionRequest>({
    method: 'POST',
    path: `/api/materials/${materialId}/questions`,
    body: request,
  });
};

export const updateQuestion = async (
  materialId: string,
  questionId: string,
  request: UpdateQuestionRequest
): Promise<Question> => {
  return apiRequest<Question, UpdateQuestionRequest>({
    method: 'PATCH',
    path: `/api/materials/${materialId}/questions/${questionId}`,
    body: request,
  });
};

export const deleteQuestion = async (materialId: string, questionId: string): Promise<void> => {
  return apiRequest<void>({
    method: 'DELETE',
    path: `/api/materials/${materialId}/questions/${questionId}`,
  });
};

export const markQuestionIncorrect = async (
  materialId: string,
  questionId: string,
): Promise<SetQuestionChoiceResponse> => {
  return apiRequest<SetQuestionChoiceResponse, SetQuestionChoiceRequest>({
    method: 'PATCH',
    path: `/api/materials/${materialId}/questions/${questionId}/choices`,
    body: { isCorrect: false },
  });
};

export const markQuestionCorrect = async (
  materialId: string,
  questionId: string,
): Promise<SetQuestionChoiceResponse> => {
  return apiRequest<SetQuestionChoiceResponse, SetQuestionChoiceRequest>({
    method: 'PATCH',
    path: `/api/materials/${materialId}/questions/${questionId}/choices`,
    body: { isCorrect: true },
  });
};

export const setQuestionChoice = async (
  materialId: string,
  questionId: string,
  request: SetQuestionChoiceRequest
): Promise<SetQuestionChoiceResponse> => {
  return apiRequest<SetQuestionChoiceResponse, SetQuestionChoiceRequest>({
    method: 'PATCH',
    path: `/api/materials/${materialId}/questions/${questionId}/choices`,
    body: request,
  });
};
