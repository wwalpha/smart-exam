import { useMemo } from 'react'
import { useWordTestStore } from '@/stores'
import type { WordTestGradingValue } from '@typings/wordtest'
import { useWordTestDetailPage } from '@/hooks/wordtest/useWordTestDetailPage'

export function useWordTestGradingPage(wordTestId: string | undefined) {
  const { wordTest } = useWordTestDetailPage(wordTestId)
  const gradings = useWordTestStore((s) => s.wordtest.gradings)
  const applyWordTestGrading = useWordTestStore((s) => s.applyWordTestGrading)

  // 採点結果は store に保存し、再表示時も初期値として復元できるようにする
  const grading = useMemo(() => {
    if (!wordTestId) return undefined
    return gradings[wordTestId]
  }, [gradings, wordTestId])

  const applyGrading = async (newGrading: WordTestGradingValue[]): Promise<void> => {
    if (!wordTestId) return

    // 採点の永続化は UI から直接 API を叩かず、store action に集約する
    await applyWordTestGrading(wordTestId, newGrading)
  }

  return {
    wordTest,
    grading,
    applyGrading,
  }
}
