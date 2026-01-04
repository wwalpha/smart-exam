import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWordTestDetailPage } from '@/hooks/wordtest';
import { SUBJECT_LABEL } from '@/lib/Consts';

export const WordTestDetailPage = () => {
  const { test, questions, onPrintClick } = useWordTestDetailPage();

  if (!test) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{test.name}</h1>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>科目: {SUBJECT_LABEL[test.subject as keyof typeof SUBJECT_LABEL]}</span>
            <span>作成日: {new Date(test.created_at).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            戻る
          </Button>
          <Button onClick={onPrintClick}>印刷用ページ</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>出題一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No.</TableHead>
                <TableHead>問題</TableHead>
                <TableHead>答え</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{q.question}</TableCell>
                  <TableCell>{q.answer}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
