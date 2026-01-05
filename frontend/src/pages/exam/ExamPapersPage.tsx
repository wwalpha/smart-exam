import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useExamPapers } from '@/hooks/exam';
import { SUBJECT_LABEL } from '@/lib/Consts';
import type { SubjectId } from '@smart-exam/api-types';

export const ExamPapersPage = () => {
  const {
    papers,
    form,
    submit,
  } = useExamPapers();
  const {
    register,
    setValue,
    formState: { isSubmitting, errors },
    watch,
  } = form;
  const subject = watch('subject');

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">試験問題管理</h1>

      <Card>
        <CardHeader>
          <CardTitle>新規登録</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Select
                  value={subject}
                  onValueChange={(v) => setValue('subject', v as SubjectId, { shouldValidate: true })}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>問題PDF</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  {...register('questionFile', { required: '必須です' })}
                  aria-invalid={!!errors.questionFile}
                  className={errors.questionFile ? 'border-destructive focus-visible:ring-destructive' : undefined}
                />
                {errors.questionFile?.message ? (
                  <p className="text-sm text-destructive">{String(errors.questionFile.message)}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>解答PDF</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  {...register('answerFile', { required: '必須です' })}
                  aria-invalid={!!errors.answerFile}
                  className={errors.answerFile ? 'border-destructive focus-visible:ring-destructive' : undefined}
                />
                {errors.answerFile?.message ? (
                  <p className="text-sm text-destructive">{String(errors.answerFile.message)}</p>
                ) : null}
              </div>
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
          <CardTitle>登録済み一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学年</TableHead>
                <TableHead>科目</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>名前</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {papers.map((paper) => (
                <TableRow key={paper.paperId}>
                  <TableCell>{paper.grade}</TableCell>
                  <TableCell>{SUBJECT_LABEL[paper.subject as keyof typeof SUBJECT_LABEL] || paper.subject}</TableCell>
                  <TableCell>{paper.category}</TableCell>
                  <TableCell>{paper.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
