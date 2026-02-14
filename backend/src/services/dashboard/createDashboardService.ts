// Module: createDashboardService responsibilities.

import type { DashboardData } from '@smart-exam/api-types';

import { createGetDashboardData } from './getDashboardData';

/** Type definition for DashboardService. */
export type DashboardService = {
  getDashboardData: () => Promise<DashboardData>;
};

/** Creates dashboard service. */
export const createDashboardService = (): DashboardService => {
  // 処理で使う値を準備する
  const getDashboardData = createGetDashboardData();

  // 処理結果を呼び出し元へ返す
  return { getDashboardData };
};
