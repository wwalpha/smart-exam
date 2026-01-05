import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useReviewCreate } from '@/hooks/review';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

export const ReviewTestCreatePage = () => {
  const { isKanji, form, submit } = useReviewCreate();
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const subject = watch('subject');

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
              <input type="hidden" {...register('subject', { required: '必須です' })} />
              <Select
                value={subject}
                onValueChange={(v) =>
                  setValue('subject', v as WordTestSubject | '', { shouldDirty: true, shouldValidate: true })
                }>
                <SelectTrigger
                  aria-invalid={!!errors.subject}
                  className={errors.subject ? 'border-destructive focus:ring-destructive' : undefined}>
                  <SelectValue placeholder="科目を選択" />
                </SelectTrigger>
                <SelectContent>
                  {isKanji ? (
                    <>
                      <SelectItem value={SUBJECT.japanese}>{SUBJECT_LABEL[SUBJECT.japanese]}</SelectItem>
                      <SelectItem value={SUBJECT.society}>{SUBJECT_LABEL[SUBJECT.society]}</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value={SUBJECT.math}>{SUBJECT_LABEL[SUBJECT.math]}</SelectItem>
                      <SelectItem value={SUBJECT.science}>{SUBJECT_LABEL[SUBJECT.science]}</SelectItem>
                      <SelectItem value={SUBJECT.society}>{SUBJECT_LABEL[SUBJECT.society]}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {errors.subject?.message ? (
                <p className="text-sm text-destructive">{String(errors.subject.message)}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>出題数</Label>
              <Input
                type="number"
                min={1}
                max={100}
                {...register('count', {
                  required: '必須です',
                  valueAsNumber: true,
                  min: { value: 1, message: '1以上で入力してください' },
                  max: { value: 100, message: '100以下で入力してください' },
                })}
                aria-invalid={!!errors.count}
                className={errors.count ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.count?.message ? (
                <p className="text-sm text-destructive">{String(errors.count.message)}</p>
              ) : null}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                キャンセル
              </Button>
              <Button type="submit">テスト生成</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
