import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useExamPapers } from '@/hooks/exam';
import { SUBJECT_LABEL } from '@/lib/Consts';

export const ExamPapersPage = () => {
  const {
    papers,
    form,
    submit,
    isSubmitting,
  } = useExamPapers();
  const { register, setValue } = form;

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
                <Input {...register('grade', { required: true })} placeholder="例: 4年" />
              </div>
              <div className="space-y-2">
                <Label>科目</Label>
                <Select onValueChange={(v) => setValue('subject', v)}>
                  <SelectTrigger>
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
              </div>
              <div className="space-y-2">
                <Label>カテゴリ</Label>
                <Input {...register('category', { required: true })} placeholder="例: Daily" />
              </div>
              <div className="space-y-2">
                <Label>回数/名前</Label>
                <Input {...register('name', { required: true })} placeholder="例: No.10" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>問題PDF</Label>
                <Input type="file" accept=".pdf" {...register('questionFile', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>解答PDF</Label>
                <Input type="file" accept=".pdf" {...register('answerFile', { required: true })} />
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
                <TableHead>登録日</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {papers.map((paper) => (
                <TableRow key={paper.paper_id}>
                  <TableCell>{paper.grade}</TableCell>
                  <TableCell>{SUBJECT_LABEL[paper.subject as keyof typeof SUBJECT_LABEL] || paper.subject}</TableCell>
                  <TableCell>{paper.category}</TableCell>
                  <TableCell>{paper.name}</TableCell>
                  <TableCell>{new Date(paper.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
