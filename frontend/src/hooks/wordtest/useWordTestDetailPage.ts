import { useEffect, useRef } from 'react'
import { useWordTestStore } from '@/stores'

export function useWordTestDetailPage(wordTestId: string | undefined) {
  const lists = useWordTestStore((s) => s.wordtest.lists)
  const details = useWordTestStore((s) => s.wordtest.details)
  const fetchWordTests = useWordTestStore((s) => s.fetchWordTests)
  const fetchWordTest = useWordTestStore((s) => s.fetchWordTest)
  const hasRequestedRef = useRef(false)
  const hasRequestedListsRef = useRef(false)

  const summary = wordTestId ? lists.find((x) => x.id === wordTestId) : undefined
  const detail = wordTestId ? details[wordTestId] : undefined

  useEffect(() => {
    if (!wordTestId) return

    // 詳細直リンク時など、一覧が未取得だと is_graded を判定できないため
    if (summary) return
    if (hasRequestedListsRef.current) return
    hasRequestedListsRef.current = true

    // 画面側で await しないため Promise を握りつぶす
    void fetchWordTests()
  }, [fetchWordTests, summary, wordTestId])

  useEffect(() => {
    if (!wordTestId) return

    // 詳細を取得済みなら追加の fetch は不要
    if (wordTestId in details) return

    // StrictMode 等で effect が複数回走っても API を多重呼び出ししないため
    if (hasRequestedRef.current) return

    hasRequestedRef.current = true

    // 画面側で await しないため Promise を握りつぶす
    void fetchWordTest(wordTestId)
  }, [details, fetchWordTest, wordTestId])

  return { summary, detail }
}
