import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useWordTestGradingPage } from '@/hooks/wordtest';
import { Controller } from 'react-hook-form';

export const WordTestGradingPage = () => {
  const navigate = useNavigate();
  const { test, questions, control, onSubmit, isSubmitting, ConfirmDialog } = useWordTestGradingPage();

  if (!test) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{test.name} - 採点</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          戻る
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>採点フォーム</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>問題</TableHead>
                  <TableHead>答え</TableHead>
                  <TableHead className="w-24 text-center">正解</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{q.question}</TableCell>
                    <TableCell>{q.answer}</TableCell>
                    <TableCell className="text-center">
                      <Controller
                        control={control}
                        name={`results.${i}.isCorrect`}
                        render={({ field: { value, onChange } }) => (
                          <Checkbox checked={value} onCheckedChange={onChange} />
                        )}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '採点結果を保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
