import { useEffect } from 'react';
import { useWordTestStore } from '@/stores';

/**
 * ダッシュボード機能のカスタムフック
 * @returns ダッシュボードデータと状態
 */
export const useDashboard = () => {
  const { data, status } = useWordTestStore((s) => s.dashboard);
  const fetchDashboardData = useWordTestStore((s) => s.fetchDashboardData);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    isLoading: status.isLoading,
    error: status.error,
  };
};
