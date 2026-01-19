import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { DashboardData } from '@smart-exam/api-types';
import { DashboardRepository } from '@/services';

export const getDashboard: AsyncHandler<{}, DashboardData, {}, ParsedQs> = async (_req, res) => {
  const data = await DashboardRepository.getDashboardData();
  res.json(data);
};
