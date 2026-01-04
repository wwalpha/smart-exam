import type { StateCreator } from 'zustand';
import type { DashboardSlice } from '@/stores/store.types';
import * as DASHBOARD_API from '@/services/dashboardApi';
import { withStatus } from '../utils';

export const createDashboardSlice: StateCreator<DashboardSlice, [], [], DashboardSlice> = (set, get) => {
  type DashboardState = DashboardSlice['dashboard'];

  const getDashboard = (): DashboardState => get().dashboard;

  const updateDashboard = (patch: Partial<DashboardState>) => {
    const current = getDashboard();
    set({
      dashboard: {
        ...current,
        ...patch,
        status: patch.status
          ? {
              ...current.status,
              ...patch.status,
            }
          : current.status,
      },
    });
  };

  const setStatus = (next: Partial<DashboardState['status']>) => {
    const current = getDashboard();
    updateDashboard({
      status: {
        ...current.status,
        ...next,
      },
    });
  };



  return {
    dashboard: {
      data: null,
      status: {
        isLoading: false,
        error: null,
      },
    },

    fetchDashboardData: async () => {
      await withStatus(
        setStatus,
        async () => {
          const data = await DASHBOARD_API.getDashboardData();
          updateDashboard({ data });
        },
        'ダッシュボードデータの取得に失敗しました。',
        { rethrow: true }
      );
    },
  };
};
