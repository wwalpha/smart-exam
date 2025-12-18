import { useEffect, useRef } from 'react'
import { useWordTestStore } from '@/stores'

export function useWordTestDetailPage(wordTestId: string | undefined) {
  const details = useWordTestStore((s) => s.wordtest.details)
  const gradings = useWordTestStore((s) => s.wordtest.gradings)
  const fetchWordTest = useWordTestStore((s) => s.fetchWordTest)
  const hasRequestedRef = useRef(false)

  const wordTest = wordTestId ? details[wordTestId] : undefined
  const grading = wordTestId ? gradings[wordTestId] : undefined

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

  return { wordTest, grading }
}
