import { useEffect, useRef } from 'react'
import { useWordTestStore } from '@/stores'
import type { CreateWordTestRequest } from '@typings/wordtest'

export function useWordTestList() {
  const datas = useWordTestStore((s) => s.wordtest.datas)
  const fetchWordTests = useWordTestStore((s) => s.fetchWordTests)
  const hasRequestedRef = useRef(false)

  useEffect(() => {
    // 一覧は初回表示で取得できれば十分なので、同一マウント中の再取得は避ける
    // StrictMode 等で effect が複数回走っても API を多重呼び出ししないため
    if (hasRequestedRef.current) return
    hasRequestedRef.current = true

    // 画面側で await しないため Promise を握りつぶす
    void fetchWordTests({})
  }, [fetchWordTests])

  return { datas }
}

export function useWordTestDetail(wordTestId: string | undefined) {
  const datas = useWordTestStore((s) => s.wordtest.datas)
  const fetchWordTest = useWordTestStore((s) => s.fetchWordTest)
  const hasRequestedRef = useRef(false)

  // 既に store にある場合はそれを使い、API への再リクエストを避ける
  const wordTest = wordTestId ? datas.find((t) => t.id === wordTestId) : undefined

  useEffect(() => {
    if (!wordTestId) return

    // 取得済みなら追加の fetch は不要
    if (wordTest) return

    // StrictMode 等で effect が複数回走っても API を多重呼び出ししないため
    if (hasRequestedRef.current) return

    hasRequestedRef.current = true

    // 画面側で await しないため Promise を握りつぶす
    void fetchWordTest({ wordTestId })
  }, [fetchWordTest, wordTest, wordTestId])

  return { wordTest }
}

export function useWordTestGrading(wordTestId: string | undefined) {
  const { wordTest } = useWordTestDetail(wordTestId)
  const wordTestGradings = useWordTestStore((s) => s.wordtest.wordTestGradings)
  const applyWordTestGrading = useWordTestStore((s) => s.applyWordTestGrading)

  // 採点結果は store に保存し、再表示時も初期値として復元できるようにする
  const grading = wordTestId ? wordTestGradings[wordTestId] : undefined

  const handleApplyGrading = async (newGrading: ('correct' | 'incorrect')[]) => {
    if (!wordTestId) return

    // 採点の永続化は UI から直接 API を叩かず、store action に集約する
    await applyWordTestGrading({ wordTestId, grading: newGrading })
  }

  return {
    wordTest,
    grading,
    applyGrading: handleApplyGrading,
  }
}

export function useWordTestCreate() {
  const createWordTest = useWordTestStore((s) => s.createWordTest)

  const handleCreate = async (request: CreateWordTestRequest): Promise<void> => {
    // 作成後の一覧反映は store 側で行うため、この hook は作成だけを責務にする
    await createWordTest(request)
  }

  return { createWordTest: handleCreate }
}
