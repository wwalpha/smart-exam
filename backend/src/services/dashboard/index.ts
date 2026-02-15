import type { DashboardData } from '@smart-exam/api-types';

import { createGetDashboardData } from './getDashboardData';

export type DashboardService = {
  getDashboardData: () => Promise<DashboardData>;
};

const createDashboardService = (): DashboardService => {
  const getDashboardData = createGetDashboardData();
  return { getDashboardData };
};

export const dashboardService = createDashboardService;
