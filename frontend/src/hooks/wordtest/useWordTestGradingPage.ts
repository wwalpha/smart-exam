import { useWordTestStore } from '@/stores'
import type { GradingData } from '@typings/wordtest'
import { useWordTestDetailPage } from '@/hooks/wordtest/useWordTestDetailPage'

export function useWordTestGradingPage(wordTestId: string | undefined) {
  const { summary, detail } = useWordTestDetailPage(wordTestId)
  const applyWordTestGrading = useWordTestStore((s) => s.applyWordTestGrading)

  const grading = (() => {
    if (!detail) return undefined
    const derived = detail.items.map((x) => x.grading)
    return derived.every((x) => x !== undefined) ? derived : undefined
  })()

  const applyGrading = async (datas: GradingData[]): Promise<void> => {
    if (!wordTestId) return

    // 採点の永続化は UI から直接 API を叩かず、store action に集約する
    await applyWordTestGrading(wordTestId, datas)
  }

  return {
    summary,
    detail,
    grading,
    applyGrading,
  }
}
