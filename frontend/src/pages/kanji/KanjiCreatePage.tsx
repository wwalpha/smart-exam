import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useKanjiCreate } from '@/hooks/kanji';

export const KanjiCreatePage = () => {
  const { form, submit, isSubmitting } = useKanjiCreate();
  const { register, setValue, watch } = form;
  const subject = watch('subject');

  return (
    <div className="space-y-6 p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>問題 *</Label>
              <Input {...register('kanji', { required: true })} placeholder="例: 憂鬱" />
            </div>

            <div className="space-y-2">
              <Label>答え</Label>
              <Input {...register('reading')} placeholder="例: ゆううつ" />
            </div>

            <div className="space-y-2">
              <Label>科目</Label>
              <input type="hidden" {...register('subject', { required: true })} />
              <Select
                value={subject}
                onValueChange={(v) => setValue('subject', v, { shouldDirty: true, shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="国語">国語</SelectItem>
                  <SelectItem value="社会">社会</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '登録中...' : '登録する'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
