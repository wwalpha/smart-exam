import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useMaterialCreate } from '@/hooks/materials';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

export const MaterialSetCreatePage = () => {
  const { form, submit, isSubmitting } = useMaterialCreate();
  const {
    register,
    setValue,
    formState: { errors },
  } = form;

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
                <Input
                  {...register('name', { required: '必須です' })}
                  aria-invalid={!!errors.name}
                  className={errors.name ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  placeholder="例: 第1回 復習テスト"
                />
                {errors.name?.message ? <p className="text-sm text-destructive">{String(errors.name.message)}</p> : null}
              </div>

              <div className="space-y-2">
                <Label>科目 *</Label>
                <input type="hidden" {...register('subject', { required: '必須です' })} />
                <Select onValueChange={(v) => setValue('subject', v as WordTestSubject, { shouldValidate: true })}>
                  <SelectTrigger
                    aria-invalid={!!errors.subject}
                    className={errors.subject ? 'border-destructive focus:ring-destructive' : undefined}
                  >
                    <SelectValue placeholder="選択してください" />
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
                <Label>学年 *</Label>
                <input type="hidden" {...register('grade', { required: '必須です' })} />
                <Select onValueChange={(v) => setValue('grade', v, { shouldValidate: true })}>
                  <SelectTrigger
                    aria-invalid={!!errors.grade}
                    className={errors.grade ? 'border-destructive focus:ring-destructive' : undefined}
                  >
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4年</SelectItem>
                    <SelectItem value="5">5年</SelectItem>
                    <SelectItem value="6">6年</SelectItem>
                  </SelectContent>
                </Select>
                {errors.grade?.message ? <p className="text-sm text-destructive">{String(errors.grade.message)}</p> : null}
              </div>

              <div className="space-y-2">
                <Label>教材種別 *</Label>
                <input type="hidden" {...register('provider', { required: '必須です' })} />
                <Select onValueChange={(v) => setValue('provider', v, { shouldValidate: true })}>
                  <SelectTrigger
                    aria-invalid={!!errors.provider}
                    className={errors.provider ? 'border-destructive focus:ring-destructive' : undefined}
                  >
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAPIX">SAPIX</SelectItem>
                    <SelectItem value="四谷">四谷</SelectItem>
                  </SelectContent>
                </Select>
                {errors.provider?.message ? (
                  <p className="text-sm text-destructive">{String(errors.provider.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>教材年月 *</Label>
                <Input
                  type="month"
                  {...register('yearMonth', { required: '必須です' })}
                  aria-invalid={!!errors.yearMonth}
                  className={errors.yearMonth ? 'border-destructive focus-visible:ring-destructive' : undefined}
                />
                {errors.yearMonth?.message ? (
                  <p className="text-sm text-destructive">{String(errors.yearMonth.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>回・テスト名 *</Label>
                <Input
                  {...register('testType', { required: '必須です' })}
                  aria-invalid={!!errors.testType}
                  className={errors.testType ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  placeholder="例: マンスリー確認テスト"
                />
                {errors.testType?.message ? (
                  <p className="text-sm text-destructive">{String(errors.testType.message)}</p>
                ) : null}
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
