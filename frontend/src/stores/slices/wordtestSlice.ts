import type { StateCreator } from 'zustand'
import type { WordTestSlice } from '@typings/store'
import * as wordtestApi from '@/services/wordtestApi'

// 単語テスト機能の Zustand slice
export const createWordTestSlice: StateCreator<WordTestSlice, [], [], WordTestSlice> = (
  set,
) => ({
  wordtest: {
    datas: [],
    wordTestGradings: {},
  },
  fetchWordTests: async (request) => {
    // 一覧はサーバー（MSW）側を正として置き換える
    const response = await wordtestApi.listWordTests(request)
    set((state) => ({
      wordtest: {
        ...state.wordtest,
        datas: response.wordTests,
      },
    }))
  },
  fetchWordTest: async (request) => {
    try {
      const response = await wordtestApi.getWordTest(request)

      set((state) => {
        // 既に存在する場合は更新し、未存在なら先頭に追加して直近アクセスを見やすくする
        const nextDatas = state.wordtest.datas.some((x) => x.id === response.wordTest.id)
          ? state.wordtest.datas.map((x) => (x.id === response.wordTest.id ? response.wordTest : x))
          : [response.wordTest, ...state.wordtest.datas]

        // 採点が返る API のため、存在する場合のみ store の採点を更新する
        const nextGradings = response.grading
          ? {
              ...state.wordtest.wordTestGradings,
              [response.wordTest.id]: response.grading,
            }
          : state.wordtest.wordTestGradings

        return {
          wordtest: {
            ...state.wordtest,
            datas: nextDatas,
            wordTestGradings: nextGradings,
          },
        }
      })

      return response.wordTest
    } catch {
      return null
    }
  },
  createWordTest: async (request) => {
    // 作成結果を即時に store に反映し、画面のリロード無しで一覧へ反映する
    const response = await wordtestApi.createWordTest(request)
    set((state) => ({
      wordtest: {
        ...state.wordtest,
        datas: [response.wordTest, ...state.wordtest.datas],
      },
    }))
    return response
  },
  applyWordTestGrading: async ({ wordTestId, grading }) => {
    // 採点は「反映する」操作で API に送信し、結果は store に保持して画面遷移しても復元できるようにする
    await wordtestApi.applyWordTestGrading({
      wordTestId,
      grading,
    })

    set((state) => ({
      wordtest: {
        ...state.wordtest,
        wordTestGradings: {
          ...state.wordtest.wordTestGradings,
          [wordTestId]: grading,
        },
      },
    }))
  },
})
