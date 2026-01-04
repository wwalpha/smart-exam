import { create } from 'zustand';
import { createWordTestSlice } from '@/stores/slices/wordtestSlice';
import { createWordMasterSlice } from '@/stores/slices/wordMasterSlice';
import { createExamSlice } from '@/stores/slices/examSlice';
import { createMaterialSlice } from '@/stores/slices/materialSlice';
import { createReviewSlice } from '@/stores/slices/reviewSlice';
import { createKanjiSlice } from '@/stores/slices/kanjiSlice';
import { createDashboardSlice } from '@/stores/slices/dashboardSlice';
import type {
  WordTestSlice,
  WordMasterSlice,
  ExamSlice,
  MaterialSlice,
  ReviewSlice,
  KanjiSlice,
  DashboardSlice,
} from '@/stores/store.types';

// ストアの create() 定義はここに集約する
export type StoreState = WordTestSlice &
  WordMasterSlice &
  ExamSlice &
  MaterialSlice &
  ReviewSlice &
  KanjiSlice &
  DashboardSlice;

// 画面側はこのフック（@/stores）だけを import する
export const useWordTestStore = create<StoreState>()((...args) => ({
  ...createWordTestSlice(...args),
  ...createWordMasterSlice(...args),
  ...createExamSlice(...args),
  ...createMaterialSlice(...args),
  ...createReviewSlice(...args),
  ...createKanjiSlice(...args),
  ...createDashboardSlice(...args),
}));

export const useStore = useWordTestStore;
