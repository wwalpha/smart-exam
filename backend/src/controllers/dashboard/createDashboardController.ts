import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';

import type { DashboardData } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const createDashboardController = (services: Services) => {
  const getDashboard: AsyncHandler<{}, DashboardData, {}, ParsedQs> = async (_req, res) => {
    const data = await services.dashboard.getDashboardData();
    res.json(data);
  };

  return { getDashboard };
};
