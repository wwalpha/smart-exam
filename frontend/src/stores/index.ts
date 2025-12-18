import { create } from 'zustand'
import { createWordTestSlice } from '@/stores/slices/wordtestSlice'
import type { WordTestSlice } from '@typings/store'

// ストアの create() 定義はここに集約する
export type StoreState = WordTestSlice

// 画面側はこのフック（@/stores）だけを import する
export const useWordTestStore = create<StoreState>()((...args) => ({
  ...createWordTestSlice(...args),
}))
