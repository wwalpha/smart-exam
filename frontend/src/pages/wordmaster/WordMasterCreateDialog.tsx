import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useWordMasterCreateDialog } from '@/hooks/wordmaster';
import { SUBJECT as subjects, SUBJECT_LABEL } from '@/lib/Consts';

type WordMasterCreateDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const WordMasterCreateDialog = ({ open, onClose }: WordMasterCreateDialogProps) => {
  const { register, selectedSubject, isCreateDisabled, getSubjectClickHandler, onCreateClick, ConfirmDialog } =
    useWordMasterCreateDialog({ onClose });

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
              {...register('title', { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label>科目選択</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="wordmaster-file">ファイル選択 (TXT)</Label>
            <p className="text-xs text-muted-foreground">形式: 問題|答え (例: 反省の気持ちをしめす。|示す)</p>
            <Input
              id="wordmaster-file"
              type="file"
              accept=".txt"
              {...register('file', { required: true })}
            />
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
