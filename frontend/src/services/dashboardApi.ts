import { apiRequest } from './apiClient';
import type { DashboardData } from '@smart-exam/api-types';

export const getDashboardData = async (): Promise<DashboardData> => {
  return apiRequest<DashboardData>({
    method: 'GET',
    path: '/api/dashboard',
  });
};
