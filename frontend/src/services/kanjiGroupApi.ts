import type { CreateKanjiGroupRequest, CreateKanjiGroupResponse, ListKanjiGroupsResponse } from '@smart-exam/api-types';
import { apiRequest } from '@/services/apiClient';

export const listWordGroups = async (): Promise<ListKanjiGroupsResponse> => {
  return apiRequest<ListKanjiGroupsResponse>({
    method: 'GET',
    path: '/api/wordgroups',
  });
};

export const createWordGroup = async (request: CreateKanjiGroupRequest): Promise<CreateKanjiGroupResponse> => {
  return apiRequest<CreateKanjiGroupResponse, CreateKanjiGroupRequest>({
    method: 'POST',
    path: '/api/wordgroups',
    body: request,
  });
};
