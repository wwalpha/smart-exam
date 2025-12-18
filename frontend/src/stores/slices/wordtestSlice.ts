import type { StateCreator } from 'zustand'
import type { WordTestSlice } from '@typings/store'
import type { GradingData } from '@typings/wordtest'
import * as wordtestApi from '@/services/wordtestApi'

// 単語テスト機能の Zustand slice
export const createWordTestSlice: StateCreator<WordTestSlice, [], [], WordTestSlice> = (
  set,
  get,
) => {
  type WordTestFeatureState = WordTestSlice['wordtest']
  type WordTestFeaturePatch = Omit<Partial<WordTestFeatureState>, 'status'> & {
    status?: Partial<WordTestFeatureState['status']>
  }

  const getWordTest = (): WordTestFeatureState => get().wordtest

  const updateWordTest = (patch: WordTestFeaturePatch) => {
    const current = getWordTest()
    set({
      wordtest: {
        ...current,
        ...patch,
        status: patch.status
          ? {
              ...current.status,
              ...patch.status,
            }
          : current.status,
      },
    })
  }

  const setStatus = (next: Partial<WordTestSlice['wordtest']['status']>) => {
    updateWordTest({ status: next })
  }

  const withWordTestStatus = async <T>(
    fn: (helpers: {
      getWordTest: () => WordTestFeatureState
      updateWordTest: (patch: WordTestFeaturePatch) => void
    }) => Promise<T>,
    errorMessage: string,
    options?: {
      fallback?: T
      rethrow?: boolean
    },
  ): Promise<T> => {
    setStatus({ isLoading: true, error: null })
    try {
      return await fn({ getWordTest, updateWordTest })
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
      lists: [],
      details: {},
      status: {
        isLoading: false,
        error: null,
      },
    },
    fetchWordTests: async () => {
      await withWordTestStatus(
        async ({ updateWordTest }) => {
          // 一覧はサーバー（MSW）側を正として置き換える
          const response = await wordtestApi.listWordTests()
          updateWordTest({ lists: response.datas })
        },
        '単語テスト一覧の取得に失敗しました。',
      )
    },
    
    fetchWordTest: async (wordTestId) => {
      return await withWordTestStatus(
        async ({ getWordTest, updateWordTest }) => {
          const response = await wordtestApi.getWordTest({ wordTestId })

          const current = getWordTest()
          // 詳細取得は items（問題/答え）を含むため、details に保持する
          const nextDetails = {
            ...current.details,
            [response.id]: response,
          }

          updateWordTest({ details: nextDetails })

          return response
        },
        '単語テストの取得に失敗しました。',
        { fallback: null },
      )
    },

    createWordTest: async (subject) => {
      return await withWordTestStatus(
        async ({ getWordTest, updateWordTest }) => {
          // 作成結果を即時に store に反映し、画面のリロード無しで一覧へ反映する
          const response = await wordtestApi.createWordTest({ subject })
          const current = getWordTest()
          updateWordTest({ lists: [response.wordTest, ...current.lists] })
          return response
        },
        '単語テストの作成に失敗しました。',
        { rethrow: true },
      )
    },

    applyWordTestGrading: async (wordTestId, datas) => {
      await withWordTestStatus(
        async ({ getWordTest, updateWordTest }) => {
          const existingDetail = getWordTest().details[wordTestId] ?? null

          if (!existingDetail) {
            throw new Error('wordtest detail not found')
          }

          const gradingByQid = new Map<string, GradingData['grading']>(
            datas.map((x) => [x.qid, x.grading]),
          )

          const nextGrading = existingDetail.items.map((item) => gradingByQid.get(item.qid))
          if (nextGrading.some((x) => x === undefined)) {
            throw new Error('grading is missing for some items')
          }

          // 採点は「反映する」操作で API に送信し、結果は store に保持して画面遷移しても復元できるようにする
          await wordtestApi.applyWordTestGrading(wordTestId, { results: datas })

          const current = getWordTest()

          const nextLists = current.lists.map((x) =>
            x.id === wordTestId
              ? {
                  ...x,
                  is_graded: true,
                }
              : x,
          )

          const currentDetail = current.details[wordTestId]
          const nextDetails = currentDetail
            ? {
                ...current.details,
                [wordTestId]: {
                  ...currentDetail,
                  items: currentDetail.items.map((item) => ({
                    ...item,
                    grading: gradingByQid.get(item.qid),
                  })),
                },
              }
            : current.details

          updateWordTest({
            lists: nextLists,
            details: nextDetails,
          })
        },
        '採点結果の反映に失敗しました。',
      )
    },
  }
}
