import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useKanjiImport } from '@/hooks/kanji';

export const KanjiImportPage = () => {
  const { form, submit, isSubmitting } = useKanjiImport();
  const { register } = form;

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
              <Label>データ貼り付け</Label>
              <p className="text-sm text-gray-500">形式: 漢字,よみ,意味,科目,出典 (1行1件)</p>
              <Textarea
                {...register('textData', { required: true })}
                className="min-h-[300px] font-mono"
                placeholder={`憂鬱,ゆううつ,気分が晴れないこと,国語,テスト1\n薔薇,ばら,植物の名前,国語,テスト1`}
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
