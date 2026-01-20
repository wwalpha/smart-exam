import type { DashboardData } from '@smart-exam/api-types';

export type DashboardService = {
  getDashboardData: () => Promise<DashboardData>;
};

export const createDashboardService = (): DashboardService => {
  const getDashboardData = async (): Promise<DashboardData> => {
    return {
      todayTestCount: 0,
      topIncorrectQuestions: [],
      lockedCount: 0,
      inventoryCount: 0,
    };
  };

  return { getDashboardData };
};
