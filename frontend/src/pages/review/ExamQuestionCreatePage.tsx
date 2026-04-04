import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReviewQuestionCreate } from '@/hooks/review';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

export const ExamQuestionCreatePage = () => {
  const { form, submit, subject, selectedMaterialIds, selectedCandidateTotal, openCandidateList, openCandidateTotal, isLoading } =
    useReviewQuestionCreate();
  const {
    register,
    setValue,
    formState: { errors },
  } = form;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
                }
              >
                <SelectTrigger
                  aria-invalid={!!errors.subject}
                  className={errors.subject ? 'border-destructive focus:ring-destructive' : undefined}
                >
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
                {...register('materialIds', {
                  validate: (value) => (value?.length ?? 0) > 0 || '出題対象教材を選択してください',
                })}
                aria-invalid={!!errors.materialIds}
                className={
                  errors.materialIds
                    ? 'w-full rounded-md border border-destructive bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2'
                    : 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                }
                disabled={!subject || openCandidateList.length === 0}
              >
                {openCandidateList.map((material) => (
                  <option key={material.id} value={material.id}>
                    {`${material.materialDate}　${material.name}（${material.provider} / 候補${material.openCandidateCount}件）`}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">候補件数（全体）: {openCandidateTotal}件</p>
              {selectedMaterialIds.length > 0 ? (
                <p className="text-sm text-muted-foreground">候補件数（選択中）: {selectedCandidateTotal}件</p>
              ) : null}
              {!subject ? <p className="text-sm text-muted-foreground">先に科目を選択してください。</p> : null}
              {subject && openCandidateList.length === 0 ? (
                <p className="text-sm text-muted-foreground">候補教材がありません。</p>
              ) : null}
              {errors.materialIds?.message ? (
                <p className="text-sm text-destructive">{String(errors.materialIds.message)}</p>
              ) : null}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                キャンセル
              </Button>
              <Button type="submit" disabled={!subject || selectedMaterialIds.length === 0 || openCandidateList.length === 0 || isLoading}>
                テスト生成
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
