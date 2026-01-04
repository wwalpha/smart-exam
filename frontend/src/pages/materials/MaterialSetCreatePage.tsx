import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useMaterialCreate } from '@/hooks/materials';

export const MaterialSetCreatePage = () => {
  const { form, submit, isSubmitting } = useMaterialCreate();
  const { register, setValue } = form;

  return (
    <div className="space-y-6 p-0 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">教材セット登録</h1>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>教材名 *</Label>
                <Input {...register('name', { required: true })} placeholder="例: 第1回 復習テスト" />
              </div>

              <div className="space-y-2">
                <Label>科目 *</Label>
                <input type="hidden" {...register('subject', { required: true })} />
                <Select onValueChange={(v) => setValue('subject', v, { shouldValidate: true })}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="算数">算数</SelectItem>
                    <SelectItem value="理科">理科</SelectItem>
                    <SelectItem value="社会">社会</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>学年 *</Label>
                <input type="hidden" {...register('grade', { required: true })} />
                <Select onValueChange={(v) => setValue('grade', v, { shouldValidate: true })}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4年</SelectItem>
                    <SelectItem value="5">5年</SelectItem>
                    <SelectItem value="6">6年</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>教材種別 *</Label>
                <input type="hidden" {...register('provider', { required: true })} />
                <Select onValueChange={(v) => setValue('provider', v, { shouldValidate: true })}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAPIX">SAPIX</SelectItem>
                    <SelectItem value="四谷">四谷</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>教材年月 *</Label>
                <Input type="month" {...register('yearMonth', { required: true })} />
              </div>

              <div className="space-y-2">
                <Label>回・テスト名 *</Label>
                <Input {...register('testType', { required: true })} placeholder="例: マンスリー確認テスト" />
              </div>

              <div className="space-y-2">
                <Label>単元</Label>
                <Input {...register('unit')} placeholder="例: 平面図形" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">ファイルアップロード</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>問題用紙 (PDF)</Label>
                  <Input type="file" accept=".pdf" {...register('questionFile')} />
                </div>
                <div className="space-y-2">
                  <Label>解答用紙 (PDF)</Label>
                  <Input type="file" accept=".pdf" {...register('answerFile')} />
                </div>
                <div className="space-y-2">
                  <Label>採点済み答案 (PDF)</Label>
                  <Input type="file" accept=".pdf" {...register('gradedFile')} />
                </div>
              </div>
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
