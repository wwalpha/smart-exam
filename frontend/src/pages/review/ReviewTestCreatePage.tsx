import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useReviewCreate } from '@/hooks/review';

export const ReviewTestCreatePage = () => {
  const { isKanji, form, submit } = useReviewCreate();
  const { register, setValue } = form;

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">{isKanji ? '漢字復習テスト作成' : '問題復習テスト作成'}</h1>

      <Card>
        <CardHeader>
          <CardTitle>条件設定</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <Label>科目</Label>
              <Select onValueChange={(v) => setValue('subject', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="科目を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="算数">算数</SelectItem>
                  <SelectItem value="国語">国語</SelectItem>
                  <SelectItem value="理科">理科</SelectItem>
                  <SelectItem value="社会">社会</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>期間 (開始)</Label>
                <Input type="date" {...register('rangeFrom')} />
              </div>
              <div className="space-y-2">
                <Label>期間 (終了)</Label>
                <Input type="date" {...register('rangeTo')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>出題数</Label>
              <Input type="number" {...register('count')} min={1} max={100} />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeCorrect" 
                onCheckedChange={(checked) => setValue('includeCorrect', checked as boolean)}
              />
              <Label htmlFor="includeCorrect">正解した問題も含める</Label>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                キャンセル
              </Button>
              <Button type="submit">
                テスト生成
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
