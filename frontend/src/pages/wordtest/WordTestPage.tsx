import { useState } from 'react'
import { Link } from 'react-router-dom'
import { WordTestCreateDialog } from '@/pages/wordtest/WordTestCreateDialog'
import { useWordTestList } from '@/hooks/wordtest'

export function WordTestPage() {
  const { wordTests } = useWordTestList()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-stone-900">単語テスト</h1>
          <p className="text-sm text-stone-700">作成済みの単語テスト一覧です。</p>
        </div>

        <button
          type="button"
          className="inline-flex items-center rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
          onClick={() => setIsCreateOpen(true)}
        >
          新規作成
        </button>
      </div>

      <section className="overflow-hidden rounded-lg border border-amber-200 bg-white/70">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-amber-50">
              <tr>
                <th className="border-b border-amber-200 px-4 py-3 font-semibold text-stone-900">
                  テスト名
                </th>
                <th className="border-b border-amber-200 px-4 py-3 font-semibold text-stone-900">
                  科目
                </th>
                <th className="border-b border-amber-200 px-4 py-3 font-semibold text-stone-900">
                  作成日
                </th>
                <th className="border-b border-amber-200 px-4 py-3 font-semibold text-stone-900">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {wordTests.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-stone-700"
                  >
                    まだ単語テストがありません。
                  </td>
                </tr>
              ) : (
                wordTests.map((test) => (
                  <tr key={test.id} className="odd:bg-white/40">
                    <td className="border-b border-amber-100 px-4 py-3 text-stone-900">
                      {test.name}
                    </td>
                    <td className="border-b border-amber-100 px-4 py-3 text-stone-900">
                      {test.subject}
                    </td>
                    <td className="border-b border-amber-100 px-4 py-3 text-stone-900">
                      {test.created_at.slice(0, 10)}
                    </td>
                    <td className="border-b border-amber-100 px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/wordtest/${test.id}`}
                          className="rounded-md border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-900 hover:bg-amber-50"
                        >
                          詳細
                        </Link>
                        <Link
                          to={`/wordtest/${test.id}/grading`}
                          className="rounded-md border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-900 hover:bg-amber-50"
                        >
                          採点
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <WordTestCreateDialog
        key={isCreateOpen ? 'create-open' : 'create-closed'}
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  )
}
