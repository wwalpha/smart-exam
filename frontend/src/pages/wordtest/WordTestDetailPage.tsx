import { Link, useParams } from 'react-router-dom'
import { useWordTestDetailPage } from '@/hooks/wordtest'
import { GRADING_LABEL, GRADING_VALUE, SUBJECT_LABEL } from '@/lib/Consts'

export function WordTestDetailPage() {
  const { wordtestid } = useParams()
  const { summary, detail } = useWordTestDetailPage(wordtestid)

  if (!detail) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-stone-900">詳細</h1>
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-stone-900">詳細</h1>
          <p className="text-sm text-stone-700">
            {subjectLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/wordtest"
            className="inline-flex items-center rounded-md border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-50"
          >
            一覧へ戻る
          </Link>
          <Link
            to={`/wordtest/${detail.id}/grading`}
            className="inline-flex items-center rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
          >
            採点へ
          </Link>
        </div>
      </div>

      <section className="rounded-lg border border-amber-200 bg-white/70 p-4">
        <h2 className="text-sm font-semibold text-stone-900">問題一覧</h2>
        {detail.items.length === 0 ? (
          <div className="mt-4 text-sm text-stone-700">まだ問題が登録されていません。</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-amber-50">
                <tr>
                  <th className="border-b border-amber-200 px-4 py-3 font-semibold text-stone-900">
                    問題
                  </th>
                  <th className="border-b border-amber-200 px-4 py-3 font-semibold text-stone-900">
                    解答
                  </th>
                  <th className="border-b border-amber-200 px-4 py-3 font-semibold text-stone-900">
                    正誤
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((item) => {
                  const value = item.grading
                  const isGraded = value !== undefined
                  const label = isGraded ? GRADING_LABEL[value] : '未採点'
                  const labelClassName = isGraded
                    ? value === GRADING_VALUE.correct
                      ? 'text-stone-900'
                      : 'text-rose-700'
                    : 'text-stone-500'

                  return (
                    <tr key={item.qid} className="odd:bg-white/40">
                      <td className="border-b border-amber-100 px-4 py-3 text-stone-900">
                        {item.question}
                      </td>
                      <td className="border-b border-amber-100 px-4 py-3 text-stone-900">
                        {item.answer}
                      </td>
                      <td className={`border-b border-amber-100 px-4 py-3 font-semibold ${labelClassName}`}>
                        {label}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
