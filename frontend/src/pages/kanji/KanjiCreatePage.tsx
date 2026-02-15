import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useKanjiCreate } from '@/hooks/kanji';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

export const KanjiCreatePage = () => {
  const { form, submit, isSubmitting } = useKanjiCreate();
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const subject = watch('subject');

  return (
    <div className="space-y-6 p-8 max-w-2xl mx-auto">
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2 pt-4">
              <Label>科目</Label>
              <input type="hidden" {...register('subject', { required: '必須です' })} />
              <Select
                value={subject}
                onValueChange={(v) =>
                  setValue('subject', v as WordTestSubject, { shouldDirty: true, shouldValidate: true })
                }>
                <SelectTrigger
                  aria-invalid={!!errors.subject}
                  className={errors.subject ? 'border-destructive focus:ring-destructive' : undefined}>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SUBJECT.japanese}>{SUBJECT_LABEL[SUBJECT.japanese]}</SelectItem>
                  <SelectItem value={SUBJECT.society}>{SUBJECT_LABEL[SUBJECT.society]}</SelectItem>
                </SelectContent>
              </Select>
              {errors.subject?.message ? (
                <p className="text-sm text-destructive">{String(errors.subject.message)}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>問題 *</Label>
              <Input
                {...register('kanji', { required: '必須です' })}
                aria-invalid={!!errors.kanji}
                className={errors.kanji ? 'border-destructive focus-visible:ring-destructive' : undefined}
                placeholder="例: 友人にねんが状を書く"
              />
              {errors.kanji?.message ? (
                <p className="text-sm text-destructive">{String(errors.kanji.message)}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>答え *</Label>
              <Input
                {...register('reading', { required: '必須です' })}
                aria-invalid={!!errors.reading}
                className={errors.reading ? 'border-destructive focus-visible:ring-destructive' : undefined}
                placeholder="例: 年賀"
              />
              {errors.reading?.message ? (
                <p className="text-sm text-destructive">{String(errors.reading.message)}</p>
              ) : null}
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
