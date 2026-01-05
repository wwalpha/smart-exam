import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useExamResults } from '@/hooks/exam';
import { SUBJECT_LABEL } from '@/lib/Consts';
import type { SubjectId } from '@smart-exam/api-types';

export const ExamResultsPage = () => {
  const {
    results,
    form,
    fieldArray,
    submit,
  } = useExamResults();
  const {
    register,
    setValue,
    formState: { isSubmitting, errors },
    watch,
  } = form;
  const { fields, append } = fieldArray;
  const subject = watch('subject');

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">試験結果管理</h1>

      <Card>
        <CardHeader>
          <CardTitle>結果登録</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>タイトル</Label>
                <Input
                  {...register('title', { required: '必須です' })}
                  aria-invalid={!!errors.title}
                  className={errors.title ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  placeholder="例: 初回挑戦"
                />
                {errors.title?.message ? <p className="text-sm text-destructive">{String(errors.title.message)}</p> : null}
              </div>
              <div className="space-y-2">
                <Label>実施日</Label>
                <Input
                  type="date"
                  {...register('testDate', { required: '必須です' })}
                  aria-invalid={!!errors.testDate}
                  className={errors.testDate ? 'border-destructive focus-visible:ring-destructive' : undefined}
                />
                {errors.testDate?.message ? (
                  <p className="text-sm text-destructive">{String(errors.testDate.message)}</p>
                ) : null}
              </div>
              <div className="col-span-2 space-y-2">
                <Label>採点済み回答用紙 (PDF)</Label>
                <Input type="file" accept=".pdf" {...register('gradedFile')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
              <div className="space-y-2">
                <Label>学年</Label>
                <Input
                  {...register('grade', { required: '必須です' })}
                  aria-invalid={!!errors.grade}
                  className={errors.grade ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  placeholder="例: 4年"
                />
                {errors.grade?.message ? <p className="text-sm text-destructive">{String(errors.grade.message)}</p> : null}
              </div>
              <div className="space-y-2">
                <Label>科目</Label>
                <input type="hidden" {...register('subject', { required: '必須です' })} />
                <Select value={subject} onValueChange={(v) => setValue('subject', v as SubjectId, { shouldValidate: true })}>
                  <SelectTrigger
                    aria-invalid={!!errors.subject}
                    className={errors.subject ? 'border-destructive focus:ring-destructive' : undefined}
                  >
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUBJECT_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subject?.message ? <p className="text-sm text-destructive">{String(errors.subject.message)}</p> : null}
              </div>
              <div className="space-y-2">
                <Label>カテゴリ</Label>
                <Input
                  {...register('category', { required: '必須です' })}
                  aria-invalid={!!errors.category}
                  className={errors.category ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  placeholder="例: Daily"
                />
                {errors.category?.message ? (
                  <p className="text-sm text-destructive">{String(errors.category.message)}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>回数/名前</Label>
                <Input
                  {...register('name', { required: '必須です' })}
                  aria-invalid={!!errors.name}
                  className={errors.name ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  placeholder="例: No.10"
                />
                {errors.name?.message ? <p className="text-sm text-destructive">{String(errors.name.message)}</p> : null}
              </div>
            </div>

            <div className="space-y-2 border-t pt-4 mt-4">
              <Label>解答詳細</Label>
              <div className="grid grid-cols-5 gap-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2 border p-2 rounded">
                    <span className="text-sm font-bold w-8">{index + 1}</span>
                    <input
                      type="checkbox"
                      {...register(`details.${index}.isCorrect`)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ number: fields.length + 1, isCorrect: false })}>
                問題を追加
              </Button>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '登録中...' : '登録する'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>結果一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>実施日</TableHead>
                <TableHead>タイトル</TableHead>
                <TableHead>科目</TableHead>
                <TableHead>問題</TableHead>
                <TableHead>得点</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.resultId}>
                  <TableCell>{result.testDate}</TableCell>
                  <TableCell>{result.title}</TableCell>
                  <TableCell>{SUBJECT_LABEL[result.subject as keyof typeof SUBJECT_LABEL] || result.subject}</TableCell>
                  <TableCell>{`${result.grade} ${result.category} ${result.name}`}</TableCell>
                  <TableCell>{result.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
