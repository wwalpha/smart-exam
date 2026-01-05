import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useKanjiImport } from '@/hooks/kanji';

export const KanjiImportPage = () => {
  const { form, submit, isSubmitting, error } = useKanjiImport();
  const { register, setValue, watch } = form;
  const subject = watch('subject');
  const fileErrorMessage = form.formState.errors.file?.message;

  return (
    <div className="space-y-6 p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>ファイルアップロード</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>科目（必須）</Label>
              <input type="hidden" {...register('subject')} />
              <Select
                value={subject}
                onValueChange={(v) => setValue('subject', v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="科目を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="国語">国語</SelectItem>
                  <SelectItem value="社会">社会</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ファイル</Label>
              <p className="text-sm text-muted-foreground">形式: 問題|解答|YYYY/MM/DD,OK|YYYY/MM/DD,NG (1行1件 / DATEは任意)</p>
              <Input type="file" accept="text/plain,.txt,.csv" {...register('file', { required: true })} />
              {fileErrorMessage ? (
                <p className="text-sm text-destructive">{fileErrorMessage}</p>
              ) : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '登録中...' : '登録'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
