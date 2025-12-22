import { useWordMasterPage } from '@/hooks/wordmaster';
import { WordMasterCreateDialog } from './WordMasterCreateDialog';
import { SUBJECT_LABEL } from '@/lib/Consts';

export function WordMasterPage() {
  const { groups, status, isCreateDialogOpen, openCreateDialog, closeCreateDialog } = useWordMasterPage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-stone-900">単語データ管理</h1>
          <p className="text-sm text-stone-600">テスト作成の元となる単語データを登録・管理します。</p>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700">
          新規登録
        </button>
      </div>

      {status.error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{status.error}</div>}

      <div className="overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-amber-200">
          <thead className="bg-amber-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
                タイトル
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
                科目
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
                登録日時
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-200 bg-white">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-sm text-stone-500">
                  登録されたデータはありません。
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr key={group.id} className="hover:bg-amber-50/50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-stone-900">{group.title}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-stone-700">
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      {SUBJECT_LABEL[group.subject]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-stone-500">
                    {new Date(group.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <WordMasterCreateDialog open={isCreateDialogOpen} onClose={closeCreateDialog} />
    </div>
  );
}
