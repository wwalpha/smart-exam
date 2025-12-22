import { create } from 'zustand';
import { createWordTestSlice } from '@/stores/slices/wordtestSlice';
import { createWordMasterSlice } from '@/stores/slices/wordMasterSlice';
import { createExamSlice } from '@/stores/slices/examSlice';
import type { WordTestSlice, WordMasterSlice, ExamSlice } from '@typings/store';

// ストアの create() 定義はここに集約する
export type StoreState = WordTestSlice & WordMasterSlice & ExamSlice;

// 画面側はこのフック（@/stores）だけを import する
export const useWordTestStore = create<StoreState>()((...args) => ({
  ...createWordTestSlice(...args),
  ...createWordMasterSlice(...args),
  ...createExamSlice(...args),
}));
