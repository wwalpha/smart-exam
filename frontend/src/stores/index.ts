import { create } from 'zustand';
import { createMaterialSlice } from '@/stores/slices/materialSlice';
import { createReviewTestSlice } from '@/stores/slices/examSlice';
import { createKanjiSlice } from '@/stores/slices/kanjiSlice';
import { createDashboardSlice } from '@/stores/slices/dashboardSlice';
import type {
  MaterialSlice,
  ReviewTestSlice,
  KanjiSlice,
  DashboardSlice,
} from '@/stores/store.types';

// ストアの create() 定義はここに集約する
export type StoreState = MaterialSlice & ReviewTestSlice & KanjiSlice & DashboardSlice;

// 画面側はこのフック（@/stores）だけを import する
export const useWordTestStore = create<StoreState>()((...args) => ({
  ...createMaterialSlice(...args),
  ...createReviewTestSlice(...args),
  ...createKanjiSlice(...args),
  ...createDashboardSlice(...args),
}));

export const useStore = useWordTestStore;
