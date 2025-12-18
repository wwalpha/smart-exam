import { create } from 'zustand'
import { createWordTestSlice, type WordTestSlice } from '@/stores/wordtest/wordtestSlice'

export type StoreState = WordTestSlice

export const useWordTestStore = create<StoreState>()((...args) => ({
  ...createWordTestSlice(...args),
}))
