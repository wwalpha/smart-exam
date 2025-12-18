import { useCallback, useMemo, useState } from 'react'
import type { GradingData, GradingValue } from '@typings/wordtest'
import { GRADING_VALUE } from '@/lib/Consts'

type UseWordTestGradingFormParams = {
  items: { qid: string; question: string }[]
  initialGrading: GradingValue[] | null
  applyGrading: (datas: GradingData[]) => Promise<void>
}

export function useWordTestGradingForm(params: UseWordTestGradingFormParams) {
  const [isApplied, setIsApplied] = useState(false)
  const [grading, setGrading] = useState<GradingValue[]>(() => {
    if (params.initialGrading && params.initialGrading.length === params.items.length) {
      return params.initialGrading
    }
    return params.items.map(() => GRADING_VALUE.correct)
  })

  const score = useMemo(() => {
    const correct = grading.filter((x) => x === GRADING_VALUE.correct).length
    const incorrect = grading.filter((x) => x === GRADING_VALUE.incorrect).length
    return { correct, incorrect }
  }, [grading])

  const onApplyClick = useCallback(() => {
    void (async () => {
      const datas: GradingData[] = params.items.map((item, index) => ({
        qid: item.qid,
        grading: grading[index],
      }))

      await params.applyGrading(datas)
      setIsApplied(true)
    })()
  }, [grading, params])

  const getSetCorrectHandler = useCallback((index: number) => {
    return () => {
      setIsApplied(false)
      setGrading((prev) => {
        const next = [...prev]
        next[index] = GRADING_VALUE.correct
        return next
      })
    }
  }, [])

  const getSetIncorrectHandler = useCallback((index: number) => {
    return () => {
      setIsApplied(false)
      setGrading((prev) => {
        const next = [...prev]
        next[index] = GRADING_VALUE.incorrect
        return next
      })
    }
  }, [])

  return {
    grading,
    score,
    isApplied,
    onApplyClick,
    getSetCorrectHandler,
    getSetIncorrectHandler,
  }
}
