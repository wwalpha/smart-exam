import type { DashboardData } from '@smart-exam/api-types';

import type { DashboardService } from './index';

const getDashboardDataImpl = async (): Promise<DashboardData> => {
  return {
    todayTestCount: 0,
    topIncorrectQuestions: [],
    lockedCount: 0,
    inventoryCount: 0,
  };
};

export const createGetDashboardData = (): DashboardService['getDashboardData'] => {
  return getDashboardDataImpl;
};
