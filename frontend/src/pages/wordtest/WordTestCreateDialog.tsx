import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useWordTestCreateDialog } from '@/hooks/wordtest';
import { SUBJECT_LABEL } from '@/lib/Consts';

type WordTestCreateDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const WordTestCreateDialog = ({ open, onClose }: WordTestCreateDialogProps) => {
  const { register, setValue, watch, formState, groups, isCreateDisabled, onCreateClick, error } =
    useWordTestCreateDialog({ onClose });
  const { errors } = formState;

  const selectedSubject = watch('subject');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>単語テスト作成</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">テスト名</Label>
            <Input
              id="name"
              placeholder="例：4年_Daily_テスト"
              {...register('name', { required: '必須です' })}
              aria-invalid={!!errors.name}
              className={errors.name ? 'border-destructive focus-visible:ring-destructive' : undefined}
            />
            {errors.name?.message ? <p className="text-sm text-destructive">{String(errors.name.message)}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>科目</Label>
            <input type="hidden" {...register('subject', { required: '必須です' })} />
            <Select onValueChange={(v) => setValue('subject', v, { shouldValidate: true })}>
              <SelectTrigger
                aria-invalid={!!errors.subject}
                className={errors.subject ? 'border-destructive focus:ring-destructive' : undefined}
              >
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUBJECT_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subject?.message ? <p className="text-sm text-destructive">{String(errors.subject.message)}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>単語データ選択</Label>
            <input type="hidden" {...register('sourceId', { required: '必須です' })} />
            <Select onValueChange={(v) => setValue('sourceId', v, { shouldValidate: true })} disabled={!selectedSubject}>
              <SelectTrigger
                aria-invalid={!!errors.sourceId}
                className={errors.sourceId ? 'border-destructive focus:ring-destructive' : undefined}
              >
                <SelectValue placeholder={selectedSubject ? '選択してください' : '先に科目を選択してください'} />
              </SelectTrigger>
              <SelectContent>
                {groups
                  .filter((g) => g.subject === selectedSubject)
                  .map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.sourceId?.message ? <p className="text-sm text-destructive">{String(errors.sourceId.message)}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">出題数</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={50}
              {...register('count', {
                required: '必須です',
                valueAsNumber: true,
                min: { value: 1, message: '1以上で入力してください' },
                max: { value: 50, message: '50以下で入力してください' },
              })}
              aria-invalid={!!errors.count}
              className={errors.count ? 'border-destructive focus-visible:ring-destructive' : undefined}
            />
            {errors.count?.message ? <p className="text-sm text-destructive">{String(errors.count.message)}</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={onCreateClick} disabled={isCreateDisabled}>
            作成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
