import type { StateCreator } from 'zustand'
import type { WordTestSlice } from '@typings/store'
import type { WordTest, WordTestDetail } from '@typings/wordtest'
import * as wordtestApi from '@/services/wordtestApi'

// 単語テスト機能の Zustand slice
export const createWordTestSlice: StateCreator<WordTestSlice, [], [], WordTestSlice> = (
  set,
) => {
  const toSummary = (wordTest: WordTestDetail): WordTest => {
    return {
      id: wordTest.id,
      name: wordTest.name,
      subject: wordTest.subject,
      created_at: wordTest.created_at,
    }
  }

  const setStatus = (next: Partial<WordTestSlice['wordtest']['status']>) => {
    set((state) => ({
      wordtest: {
        ...state.wordtest,
        status: {
          ...state.wordtest.status,
          ...next,
        },
      },
    }))
  }

  const withWordTestStatus = async <T>(
    fn: () => Promise<T>,
    errorMessage: string,
    options?: {
      fallback?: T
      rethrow?: boolean
    },
  ): Promise<T> => {
    setStatus({ isLoading: true, error: null })
    try {
      return await fn()
    } catch (error) {
      setStatus({ error: errorMessage })
      if (options?.rethrow) throw error
      return options?.fallback as T
    } finally {
      setStatus({ isLoading: false })
    }
  }

  return {
    wordtest: {
      datas: [],
      details: {},
      gradings: {},
      status: {
        isLoading: false,
        error: null,
      },
    },
    fetchWordTests: async () => {
      await withWordTestStatus(
        async () => {
          // 一覧はサーバー（MSW）側を正として置き換える
          const response = await wordtestApi.listWordTests()
          set((state) => ({
            wordtest: {
              ...state.wordtest,
              datas: response.wordTests,
            },
          }))
        },
        '単語テスト一覧の取得に失敗しました。',
      )
    },
    fetchWordTest: async (wordTestId) => {
      return await withWordTestStatus(
        async () => {
          const response = await wordtestApi.getWordTest({ wordTestId })

          set((state) => {
            const summary = toSummary(response.wordTest)

            // 一覧はサマリのみ保持する
            const nextDatas = state.wordtest.datas.some((x) => x.id === summary.id)
              ? state.wordtest.datas.map((x) => (x.id === summary.id ? summary : x))
              : [summary, ...state.wordtest.datas]

            // 詳細取得は items（問題/答え）を含むため、details に保持する
            const nextDetails = {
              ...state.wordtest.details,
              [response.wordTest.id]: response.wordTest,
            }

            // 採点が返る API のため、存在する場合のみ store の採点を更新する
            const nextGradings = response.grading
              ? {
                  ...state.wordtest.gradings,
                  [response.wordTest.id]: response.grading,
                }
              : state.wordtest.gradings

            return {
              wordtest: {
                ...state.wordtest,
                datas: nextDatas,
                details: nextDetails,
                gradings: nextGradings,
              },
            }
          })

          return response.wordTest
        },
        '単語テストの取得に失敗しました。',
        { fallback: null },
      )
    },
    createWordTest: async (subject) => {
      return await withWordTestStatus(
        async () => {
          // 作成結果を即時に store に反映し、画面のリロード無しで一覧へ反映する
          const response = await wordtestApi.createWordTest({ subject })
          set((state) => ({
            wordtest: {
              ...state.wordtest,
              datas: [response.wordTest, ...state.wordtest.datas],
            },
          }))
          return response
        },
        '単語テストの作成に失敗しました。',
        { rethrow: true },
      )
    },
    applyWordTestGrading: async (wordTestId, grading) => {
      await withWordTestStatus(
        async () => {
          // 採点は「反映する」操作で API に送信し、結果は store に保持して画面遷移しても復元できるようにする
          await wordtestApi.applyWordTestGrading({
            wordTestId,
            grading,
          })

          set((state) => ({
            wordtest: {
              ...state.wordtest,
              gradings: {
                ...state.wordtest.gradings,
                [wordTestId]: grading,
              },
            },
          }))
        },
        '採点結果の反映に失敗しました。',
      )
    },
  }
}
