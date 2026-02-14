import type { DashboardData } from '@smart-exam/api-types';

import type { DashboardService } from './createDashboardService';

export const createGetDashboardData = (): DashboardService['getDashboardData'] => {
  return async (): Promise<DashboardData> => {
    return {
      todayTestCount: 0,
      topIncorrectQuestions: [],
      lockedCount: 0,
      inventoryCount: 0,
    };
  };
};
