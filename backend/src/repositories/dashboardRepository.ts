import type { DashboardData } from '@smart-exam/api-types';

export const DashboardRepository = {
  getDashboardData: async (): Promise<DashboardData> => {
    return {
      todayTestCount: 0,
      topIncorrectQuestions: [],
      lockedCount: 0,
      inventoryCount: 0,
    };
  },
};
