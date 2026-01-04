import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKanjiImport } from '@/hooks/kanji';

export const KanjiImportPage = () => {
  const { form, submit, isSubmitting } = useKanjiImport();
  const { register, setValue, watch } = form;
  const subject = watch('subject');

  return (
    <div className="space-y-6 p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">漢字一括登録</h1>

      <Card>
        <CardHeader>
          <CardTitle>CSV / テキスト入力</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>科目（任意）</Label>
              <input type="hidden" {...register('subject')} />
              <Select
                value={subject}
                onValueChange={(v) => setValue('subject', v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択しない（入力データに含める）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">選択しない</SelectItem>
                  <SelectItem value="国語">国語</SelectItem>
                  <SelectItem value="社会">社会</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>データ貼り付け</Label>
              <p className="text-sm text-gray-500">形式: 問題,答え,意味,科目 (任意) (1行1件)</p>
              <Textarea
                {...register('textData', { required: true })}
                className="min-h-[300px] font-mono"
                placeholder={`憂鬱,ゆううつ,気分が晴れないこと,国語\n薔薇,ばら,植物の名前,国語`}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '登録中...' : '一括登録する'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
