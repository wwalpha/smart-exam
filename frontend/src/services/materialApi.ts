import { apiRequest } from './apiClient';
import type {
  AnalyzeMaterialResponse,
  ListOpenCandidateMaterialsRequest,
  ListOpenCandidateMaterialsResponse,
  Material,
  MaterialListResponse,
  SearchMaterialsRequest,
  CreateMaterialRequest,
  CreateMaterialResponse,
  UpdateMaterialRequest,
  MaterialFile,
  ListMaterialFilesResponse,
  UploadMaterialFileRequest,
  UploadMaterialFileResponse,
  Question,
  QuestionListResponse,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  SetQuestionChoiceRequest,
  SetQuestionChoiceResponse,
  CompleteMaterialRequest,
  CompleteMaterialResponse,
} from '@smart-exam/api-types';

type UploadMaterialFileBody = UploadMaterialFileRequest;

export const listMaterials = async (params?: SearchMaterialsRequest): Promise<MaterialListResponse> => {
  return apiRequest<MaterialListResponse, SearchMaterialsRequest>({
    method: 'POST',
    path: '/api/materials/search',
    body: params ?? {},
  });
};

export const listOpenCandidateMaterials = async (
  params: ListOpenCandidateMaterialsRequest,
): Promise<ListOpenCandidateMaterialsResponse> => {
  return apiRequest<ListOpenCandidateMaterialsResponse, ListOpenCandidateMaterialsRequest>({
    method: 'POST',
    path: '/api/materials/open-candidates',
    body: params,
  });
};

export const createMaterial = async (request: CreateMaterialRequest): Promise<CreateMaterialResponse> => {
  return apiRequest<CreateMaterialResponse, CreateMaterialRequest>({
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

export const uploadMaterialFile = async (
  materialId: string,
  request: UploadMaterialFileBody,
): Promise<UploadMaterialFileResponse> => {
  return apiRequest<UploadMaterialFileResponse, UploadMaterialFileBody>({
    method: 'POST',
    path: `/api/materials/${materialId}/upload`,
    body: request,
  });
};

export const analyzeMaterial = async (materialId: string): Promise<AnalyzeMaterialResponse> => {
  return apiRequest<AnalyzeMaterialResponse>({
    method: 'POST',
    path: `/api/materials/${materialId}/analyze`,
  });
};

export const uploadFileToS3 = async (uploadUrl: string, file: File): Promise<void> => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    throw new Error('S3 upload failed');
  }
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
