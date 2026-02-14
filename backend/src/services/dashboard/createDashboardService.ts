// Module: createDashboardService responsibilities.

import type { DashboardData } from '@smart-exam/api-types';

import { createGetDashboardData } from './getDashboardData';

/** Type definition for DashboardService. */
export type DashboardService = {
  getDashboardData: () => Promise<DashboardData>;
};

/** Creates dashboard service. */
export const createDashboardService = (): DashboardService => {
  const getDashboardData = createGetDashboardData();

  return { getDashboardData };
};
