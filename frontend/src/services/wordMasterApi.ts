import type { CreateWordGroupRequest, CreateWordGroupResponse, ListWordGroupsResponse } from '@smart-exam/api-types';
import { apiRequest } from '@/services/apiClient';

export const listWordGroups = async (): Promise<ListWordGroupsResponse> => {
  return apiRequest<ListWordGroupsResponse>({
    method: 'GET',
    path: '/api/wordgroups',
  });
};

export const createWordGroup = async (request: CreateWordGroupRequest): Promise<CreateWordGroupResponse> => {
  return apiRequest<CreateWordGroupResponse, CreateWordGroupRequest>({
    method: 'POST',
    path: '/api/wordgroups',
    body: request,
  });
};
