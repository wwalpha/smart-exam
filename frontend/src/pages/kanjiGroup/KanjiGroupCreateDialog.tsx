import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useKanjiGroupCreateDialog } from '@/hooks/kanjiGroup';
import { SUBJECT as subjects, SUBJECT_LABEL } from '@/lib/Consts';

type KanjiGroupCreateDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const KanjiGroupCreateDialog = ({ open, onClose }: KanjiGroupCreateDialogProps) => {
  const { register, formState, selectedSubject, isCreateDisabled, getSubjectClickHandler, onCreateClick, error, ConfirmDialog } =
    useKanjiGroupCreateDialog({ onClose });
  const { errors } = formState;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <ConfirmDialog />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>単語データ登録</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              placeholder="例：4年_Daily"
              {...register('title', { required: '必須です' })}
              aria-invalid={!!errors.title}
              className={errors.title ? 'border-destructive focus-visible:ring-destructive' : undefined}
            />
            {errors.title?.message ? <p className="text-sm text-destructive">{String(errors.title.message)}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>科目選択</Label>
            <input type="hidden" {...register('subject', { required: '必須です' })} />
            <div className="flex flex-wrap gap-2">
              {([subjects.society, subjects.japanese] as const).map((value) => {
                const isActive = selectedSubject === value;
                return (
                  <Button
                    key={value}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    onClick={getSubjectClickHandler(value)}
                    className={isActive ? 'bg-rose-700 hover:bg-rose-800' : ''}
                  >
                    {SUBJECT_LABEL[value]}
                  </Button>
                );
              })}
            </div>
            {errors.subject?.message ? (
              <p className="text-sm text-destructive">{String(errors.subject.message)}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="kanjiGroup-file">ファイル選択 (TXT)</Label>
            <p className="text-xs text-muted-foreground">形式: 問題|答え (例: 反省の気持ちをしめす。|示す)</p>
            <Input
              id="kanjiGroup-file"
              type="file"
              accept=".txt"
              {...register('file', { required: '必須です' })}
              aria-invalid={!!errors.file}
              className={errors.file ? 'border-destructive focus-visible:ring-destructive' : undefined}
            />
            {errors.file?.message ? <p className="text-sm text-destructive">{String(errors.file.message)}</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={onCreateClick} disabled={isCreateDisabled}>
            登録
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
