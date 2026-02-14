import type { DashboardData } from '@smart-exam/api-types';

import type { DashboardService } from './createDashboardService';

// 公開するサービス処理を定義する
export const createGetDashboardData = (): DashboardService['getDashboardData'] => {
  // 処理結果を呼び出し元へ返す
  return async (): Promise<DashboardData> => {
    // 処理結果を呼び出し元へ返す
    return {
      todayTestCount: 0,
      topIncorrectQuestions: [],
      lockedCount: 0,
      inventoryCount: 0,
    };
  };
};
