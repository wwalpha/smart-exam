import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReviewGrading } from '@/hooks/review';

export const ReviewTestGradingPage = () => {
  const {
    review,
    isLoading,
    error,
    basePath,
    fields,
    watch,
    setValue,
    setAllCorrect,
    submit,
    id,
  } = useReviewGrading();

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!review) {
    return <div className="p-8">データの取得に失敗しました。</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">採点入力: {review.testId}</h1>
        <Button asChild variant="outline">
          <Link to={`${basePath}/${id}`}>キャンセル</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>回答チェック</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit}>
            <div className="mb-4 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={setAllCorrect}>
                全問正解
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>問題</TableHead>
                  <TableHead>正解</TableHead>
                  <TableHead className="w-24 text-center">不正解</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const question = review.items.find((i) => i.itemId === field.itemId);
                  const isCorrect = watch(`items.${index}.isCorrect`);
                  return (
                    <TableRow key={field.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{question?.questionText}</TableCell>
                      <TableCell>{question?.answerText}</TableCell>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={!isCorrect}
                          onChange={(e) => {
                            setValue(`items.${index}.isCorrect`, !e.target.checked, { shouldDirty: true });
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="mt-6 flex justify-end">
              <Button type="submit">採点を保存</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
