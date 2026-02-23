import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useMaterialCreate } from '@/hooks/materials';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import { MATERIAL_NAME_OPTIONS_BY_PROVIDER, MATERIAL_PROVIDER_OPTIONS } from '@/lib/materialConsts';
import type { WordTestSubject } from '@typings/wordtest';

export const MaterialSetCreatePage = () => {
  const { form, submit, isSubmitting } = useMaterialCreate();
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const provider = watch('provider');
  const subjects = watch('subject') ?? [];
  const nameOptions = provider ? MATERIAL_NAME_OPTIONS_BY_PROVIDER[provider as keyof typeof MATERIAL_NAME_OPTIONS_BY_PROVIDER] : null;

  const toggleSubject = (subject: WordTestSubject, checked: boolean) => {
    const current = watch('subject') ?? [];
    const next = checked ? Array.from(new Set([...current, subject])) : current.filter((item) => item !== subject);
    setValue('subject', next, { shouldValidate: true });
  };

  return (
    <div className="space-y-6 p-0 max-w-3xl mx-auto">
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-4 gap-4 py-6">
              <div className="space-y-2">
                <Label>学年 *</Label>
                <input type="hidden" {...register('grade', { required: '必須です' })} />
                <Select onValueChange={(v) => setValue('grade', v, { shouldValidate: true })}>
                  <SelectTrigger
                    aria-invalid={!!errors.grade}
                    className={errors.grade ? 'border-destructive focus:ring-destructive' : undefined}>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4年</SelectItem>
                    <SelectItem value="5">5年</SelectItem>
                    <SelectItem value="6">6年</SelectItem>
                  </SelectContent>
                </Select>
                {errors.grade?.message ? (
                  <p className="text-sm text-destructive">{String(errors.grade.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>教材種別 *</Label>
                <input type="hidden" {...register('provider', { required: '必須です' })} />
                <Select
                  onValueChange={(v) => {
                    setValue('provider', v, { shouldValidate: true });
                    // 教材種別に依存するため、教材名は選択し直させる
                    setValue('name', '', { shouldValidate: true });
                  }}>
                  <SelectTrigger
                    aria-invalid={!!errors.provider}
                    className={errors.provider ? 'border-destructive focus:ring-destructive' : undefined}>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_PROVIDER_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.provider?.message ? (
                  <p className="text-sm text-destructive">{String(errors.provider.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>教材名 *</Label>
                <input type="hidden" {...register('name', { required: '必須です' })} />
                <Select
                  disabled={!provider}
                  onValueChange={(v) => setValue('name', v, { shouldValidate: true })}
                >
                  <SelectTrigger
                    aria-invalid={!!errors.name}
                    className={errors.name ? 'border-destructive focus:ring-destructive' : undefined}>
                    <SelectValue placeholder={provider ? '選択してください' : '先に教材種別を選択してください'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(nameOptions ?? []).map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.name?.message ? (
                  <p className="text-sm text-destructive">{String(errors.name.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2 col-span-2">
                <Label>教材年月日 *</Label>
                <Input
                  type="date"
                  {...register('materialDate', {
                    required: '必須です',
                    onChange: (event) => {
                      const selectedDate = event.target.value;
                      setValue('registeredDate', selectedDate, { shouldValidate: true });
                    },
                  })}
                  aria-invalid={!!errors.materialDate}
                  className={errors.materialDate ? 'border-destructive focus-visible:ring-destructive' : undefined}
                />
                {errors.materialDate?.message ? (
                  <p className="text-sm text-destructive">{String(errors.materialDate.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2 col-span-2">
                <Label>初回実施日 *</Label>
                <Input
                  type="date"
                  {...register('registeredDate', { required: '必須です' })}
                  aria-invalid={!!errors.registeredDate}
                  className={errors.registeredDate ? 'border-destructive focus-visible:ring-destructive' : undefined}
                />
                {errors.registeredDate?.message ? (
                  <p className="text-sm text-destructive">{String(errors.registeredDate.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2 col-span-4">
                <Label>科目 *</Label>
                <input
                  type="hidden"
                  {...register('subject', {
                    validate: (value) => (Array.isArray(value) && value.length > 0 ? true : '必須です'),
                  })}
                />
                <div className="flex flex-wrap gap-6 rounded-md border p-3">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={subjects.includes(SUBJECT.math)}
                      onCheckedChange={(checked) => toggleSubject(SUBJECT.math, Boolean(checked))}
                    />
                    <span>{SUBJECT_LABEL[SUBJECT.math]}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={subjects.includes(SUBJECT.science)}
                      onCheckedChange={(checked) => toggleSubject(SUBJECT.science, Boolean(checked))}
                    />
                    <span>{SUBJECT_LABEL[SUBJECT.science]}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={subjects.includes(SUBJECT.society)}
                      onCheckedChange={(checked) => toggleSubject(SUBJECT.society, Boolean(checked))}
                    />
                    <span>{SUBJECT_LABEL[SUBJECT.society]}</span>
                  </label>
                </div>
                {errors.subject?.message ? (
                  <p className="text-sm text-destructive">{String(errors.subject.message)}</p>
                ) : null}
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
