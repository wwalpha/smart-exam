import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import type { ApplyWordTestGradingRequest, GradingValue } from '@typings/wordtest'
import { GRADING_VALUE, SUBJECT_LABEL } from '@/lib/Consts'
import { useWordTestGradingPage } from '@/hooks/wordtest'

export function WordTestGradingPage() {
  const { wordtestid } = useParams()
  const { summary, detail, grading, applyGrading } = useWordTestGradingPage(wordtestid)

  if (!detail) {
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

  const subjectLabel = summary
    ? `${summary.name}（${SUBJECT_LABEL[summary.subject]}）`
    : `ID: ${detail.id}`

  return (
    <WordTestGradingForm
      key={detail.id}
      wordTestId={detail.id}
      items={detail.items.map((x) => ({ qid: x.qid, question: x.question }))}
      subjectLabel={subjectLabel}
      initialGrading={grading ?? null}
      onApply={async (request: ApplyWordTestGradingRequest) => {
        await applyGrading(request.results)
      }}
    />
  )
}

type WordTestGradingFormProps = {
  wordTestId: string
  subjectLabel: string
  items: { qid: string; question: string }[]
  initialGrading: GradingValue[] | null
  onApply: (request: ApplyWordTestGradingRequest) => Promise<void>
}

function WordTestGradingForm({
  wordTestId,
  subjectLabel,
  items,
  initialGrading,
  onApply,
}: WordTestGradingFormProps) {
  const [isApplied, setIsApplied] = useState(false)
  const [grading, setGrading] = useState<GradingValue[]>(() => {
    if (initialGrading && initialGrading.length === items.length) {
      return initialGrading
    }
    return items.map(() => GRADING_VALUE.correct)
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
                const datas = items.map((item, index) => ({
                  qid: item.qid,
                  grading: grading[index],
                }))
                await onApply({ results: datas })
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

        {items.length === 0 ? (
          <div className="mt-4 text-sm text-stone-700">採点対象の単語がありません。</div>
        ) : (
          <div className="mt-4 space-y-2">
            {items.map((item, index) => {
              const value = grading[index]
              return (
                <div
                  key={item.qid}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-100 bg-white/60 px-3 py-2"
                >
                  <div className="text-sm font-semibold text-stone-900">{item.question}</div>
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
