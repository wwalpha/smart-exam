import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import type { ApplyWordTestGradingParams, WordTestGradingValue } from '@typings/wordtest'
import { GRADING_VALUE, SUBJECT_LABEL } from '@/lib/Consts'
import { useWordTestGradingPage } from '@/hooks/wordtest'

export function WordTestGradingPage() {
  const { wordtestid } = useParams()
  const { wordTest, grading, applyGrading } = useWordTestGradingPage(wordtestid)

  if (!wordTest) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-stone-900">採点</h1>
          <p className="text-sm text-stone-700">
            読み込み中...
          </p>
        </div>
        <Link
          to="/wordtest"
          className="inline-flex items-center rounded-md border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-50"
        >
          一覧へ戻る
        </Link>
      </div>
    )
  }

  return (
    <WordTestGradingForm
      key={wordTest.id}
      wordTestId={wordTest.id}
      questions={wordTest.items.map((x) => x.question)}
      subjectLabel={`${wordTest.name}（${SUBJECT_LABEL[wordTest.subject]}）`}
      initialGrading={grading ?? null}
      onApply={async (params: ApplyWordTestGradingParams) => {
        await applyGrading(params.grading)
      }}
    />
  )
}

type WordTestGradingFormProps = {
  wordTestId: string
  subjectLabel: string
  questions: string[]
  initialGrading: WordTestGradingValue[] | null
  onApply: (params: ApplyWordTestGradingParams) => Promise<void>
}

function WordTestGradingForm({
  wordTestId,
  subjectLabel,
  questions,
  initialGrading,
  onApply,
}: WordTestGradingFormProps) {
  const [isApplied, setIsApplied] = useState(false)
  const [grading, setGrading] = useState<WordTestGradingValue[]>(() => {
    if (initialGrading && initialGrading.length === questions.length) {
      return initialGrading
    }
    return questions.map(() => GRADING_VALUE.correct)
  })

  const score = useMemo(() => {
    const correct = grading.filter((x) => x === GRADING_VALUE.correct).length
    const incorrect = grading.filter((x) => x === GRADING_VALUE.incorrect).length
    return { correct, incorrect }
  }, [grading])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-stone-900">採点</h1>
          <p className="text-sm text-stone-700">{subjectLabel}</p>
          <p className="text-xs text-stone-700">正: {score.correct} / 誤: {score.incorrect}</p>
          {isApplied ? (
            <p className="text-xs font-semibold text-rose-700">反映しました</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/wordtest/${wordTestId}`}
            className="inline-flex items-center rounded-md border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-50"
          >
            詳細へ
          </Link>
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
            onClick={() => {
              void (async () => {
                await onApply({
                  wordTestId,
                  grading,
                })
                setIsApplied(true)
              })()
            }}
          >
            反映する
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-amber-200 bg-white/70 p-4">
        <h2 className="text-sm font-semibold text-stone-900">採点対象</h2>

        {questions.length === 0 ? (
          <div className="mt-4 text-sm text-stone-700">採点対象の単語がありません。</div>
        ) : (
          <div className="mt-4 space-y-2">
            {questions.map((question, index) => {
              const value = grading[index]
              return (
                <div
                  key={`${index}_${question}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-100 bg-white/60 px-3 py-2"
                >
                  <div className="text-sm font-semibold text-stone-900">{question}</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={[
                        'rounded-md border px-3 py-1 text-xs font-semibold',
                        value === GRADING_VALUE.correct
                          ? 'border-rose-700 bg-rose-700 text-white'
                          : 'border-amber-200 bg-white text-stone-900 hover:bg-amber-50',
                      ].join(' ')}
                      onClick={() => {
                        setIsApplied(false)
                        setGrading((prev) => {
                          const next = [...prev]
                          next[index] = GRADING_VALUE.correct
                          return next
                        })
                      }}
                    >
                      正
                    </button>
                    <button
                      type="button"
                      className={[
                        'rounded-md border px-3 py-1 text-xs font-semibold',
                        value === GRADING_VALUE.incorrect
                          ? 'border-stone-700 bg-stone-700 text-white'
                          : 'border-amber-200 bg-white text-stone-900 hover:bg-amber-50',
                      ].join(' ')}
                      onClick={() => {
                        setIsApplied(false)
                        setGrading((prev) => {
                          const next = [...prev]
                          next[index] = GRADING_VALUE.incorrect
                          return next
                        })
                      }}
                    >
                      誤
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
