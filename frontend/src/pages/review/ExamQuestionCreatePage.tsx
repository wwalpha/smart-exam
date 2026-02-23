import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReviewQuestionCreate } from '@/hooks/review';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

export const ExamQuestionCreatePage = () => {
  const { form, submit, subject, openCandidateList, openCandidateTotal } = useReviewQuestionCreate();
  const {
    register,
    setValue,
    formState: { errors },
  } = form;

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">復習テスト作成</h1>

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
                  <SelectItem value={SUBJECT.math}>{SUBJECT_LABEL[SUBJECT.math]}</SelectItem>
                  <SelectItem value={SUBJECT.science}>{SUBJECT_LABEL[SUBJECT.science]}</SelectItem>
                  <SelectItem value={SUBJECT.society}>{SUBJECT_LABEL[SUBJECT.society]}</SelectItem>
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

            <div className="space-y-2">
              <Label>出題対象教材（複数選択可）</Label>
              <select
                multiple
                size={Math.min(8, Math.max(4, openCandidateList.length || 4))}
                {...register('materialIds')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={!subject || openCandidateList.length === 0}>
                {openCandidateList.map((material) => (
                  <option key={material.id} value={material.id}>
                    {`${material.materialDate}　${material.name}（${material.provider} / 候補${material.openCandidateCount}件）`}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">候補件数: {openCandidateTotal}件</p>
              {!subject ? <p className="text-sm text-muted-foreground">先に科目を選択してください。</p> : null}
              {subject && openCandidateList.length === 0 ? (
                <p className="text-sm text-muted-foreground">候補教材がありません。</p>
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
