import { useWordMasterCreateDialog } from '@/hooks/wordmaster';
import { SUBJECT as subjects, SUBJECT_LABEL } from '@/lib/Consts';

type WordMasterCreateDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function WordMasterCreateDialog({ open, onClose }: WordMasterCreateDialogProps) {
  const { register, selectedSubject, isCreateDisabled, getSubjectClickHandler, onCreateClick } =
    useWordMasterCreateDialog({ onClose });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="単語データ登録"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}>
      <div className="w-full max-w-lg rounded-lg border border-amber-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-stone-900">単語データ登録</h1>
            <p className="text-sm text-stone-700">単語リストを登録します。</p>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm font-semibold text-stone-700 hover:bg-amber-50"
            onClick={onClose}>
            ×
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <section className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-stone-900">タイトル</h2>
                <input
                  type="text"
                  placeholder="例：4年_Daily"
                  className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-stone-900"
                  {...register('title', { required: true })}
                />
              </div>

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

              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-900" htmlFor="wordmaster-file">
                  ファイル選択 (TXT)
                </label>
                <p className="text-xs text-stone-500">形式: 問題|答え (例: 反省の気持ちをしめす。|示す)</p>
                <input
                  id="wordmaster-file"
                  type="file"
                  accept=".txt"
                  className="w-full text-sm text-stone-900 file:mr-4 file:rounded-md file:border-0 file:bg-rose-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-rose-800"
                  {...register('file', { required: true })}
                />
              </div>
            </div>
          </section>
        </div>

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
            登録
          </button>
        </div>
      </div>
    </div>
  );
}
