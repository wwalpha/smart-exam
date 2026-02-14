// Module: createDashboardService responsibilities.

import type { DashboardData } from '@smart-exam/api-types';


/** Type definition for DashboardService. */
export type DashboardService = {
  getDashboardData: () => Promise<DashboardData>;
};

/** Creates dashboard service. */
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
