import { useWordTestCreateDialog } from '@/hooks/wordtest';
import { SUBJECT as subjects, SUBJECT_LABEL } from '@/lib/Consts';

type WordTestCreateDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function WordTestCreateDialog({ open, onClose }: WordTestCreateDialogProps) {
  const { register, selectedSubject, isCreateDisabled, getSubjectClickHandler, onCreateClick } =
    useWordTestCreateDialog({ onClose });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="単語テスト新規作成"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}>
      <div className="w-full max-w-lg rounded-lg border border-amber-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-stone-900">単語テスト新規作成</h1>
            <p className="text-sm text-stone-700">科目を選択してテストを作成します。</p>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm font-semibold text-stone-700 hover:bg-amber-50"
            onClick={onClose}>
            ×
          </button>
        </div>

        <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50/40 p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-stone-900">科目選択</h2>
              <div className="flex flex-wrap gap-2">
                {([subjects.society, subjects.japanese] as const).map((value) => {
                  const isActive = selectedSubject === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={getSubjectClickHandler(value)}
                      className={[
                        'rounded-md border px-3 py-2 text-sm font-semibold',
                        isActive
                          ? 'border-rose-700 bg-rose-700 text-white'
                          : 'border-amber-200 bg-white text-stone-900 hover:bg-amber-50',
                      ].join(' ')}>
                      {SUBJECT_LABEL[value]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 text-right">
              <div className="flex items-center justify-end gap-3">
                <label className="text-sm font-semibold text-stone-900" htmlFor="wordtest-count">
                  問題数
                </label>
                <input
                  id="wordtest-count"
                  type="number"
                  min={1}
                  className="w-28 rounded-md border border-amber-200 bg-white px-3 py-2 text-right text-sm text-stone-900"
                  {...register('count', {
                    valueAsNumber: true,
                    required: true,
                    min: 1,
                  })}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-50"
            onClick={onClose}>
            キャンセル
          </button>

          <button
            type="button"
            disabled={isCreateDisabled}
            className="rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onCreateClick}>
            テストを作成
          </button>
        </div>
      </div>
    </div>
  );
}
