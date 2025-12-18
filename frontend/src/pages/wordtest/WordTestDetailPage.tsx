import { Link, useParams } from 'react-router-dom'
import { useWordTestDetail } from '@/hooks/wordtest'

export function WordTestDetailPage() {
  const { wordtestid } = useParams()
  const { wordTest, isNotFound } = useWordTestDetail(wordtestid)

  if (!wordTest) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-stone-900">詳細</h1>
          <p className="text-sm text-stone-700">
            {isNotFound ? '対象の単語テストが見つかりません。' : '読み込み中...'}
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-stone-900">詳細</h1>
          <p className="text-sm text-stone-700">
            {wordTest.name}（{wordTest.subject}）
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
            to={`/wordtest/${wordTest.id}/grading`}
            className="inline-flex items-center rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
          >
            採点へ
          </Link>
        </div>
      </div>

      <section className="rounded-lg border border-amber-200 bg-white/70 p-4">
        <h2 className="text-sm font-semibold text-stone-900">テスト対象単語一覧</h2>
        {wordTest.words.length === 0 ? (
          <div className="mt-4 text-sm text-stone-700">まだ単語が登録されていません。</div>
        ) : (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-stone-900">
            {wordTest.words.map((word) => (
              <li key={word}>{word}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
