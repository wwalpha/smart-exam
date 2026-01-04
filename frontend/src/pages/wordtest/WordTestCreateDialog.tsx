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
  const { register, setValue, watch, groups, isCreateDisabled, onCreateClick } = useWordTestCreateDialog({ onClose });

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
            <Input id="name" placeholder="例：4年_Daily_テスト" {...register('name', { required: true })} />
          </div>

          <div className="space-y-2">
            <Label>科目</Label>
            <Select onValueChange={(v) => setValue('subject', v)}>
              <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label>単語データ選択</Label>
            <Select onValueChange={(v) => setValue('source_id', v)} disabled={!selectedSubject}>
              <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">出題数</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={50}
              {...register('count', { required: true, min: 1, max: 50 })}
            />
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
