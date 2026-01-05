import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReviewDetail } from '@/hooks/review';

export const ReviewTestDetailPage = () => {
  const { review, isLoading, error, basePath, remove, ConfirmDialog } = useReviewDetail();

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
    <div className="space-y-6 p-8">
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">テスト詳細: {review.testId}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={basePath}>一覧へ戻る</Link>
          </Button>
          <Button asChild>
            <Link to={`${basePath}/${review.id}/grading`}>結果入力</Link>
          </Button>
          <Button asChild>
            <Link to={`${basePath}/${review.id}/pdf`}>PDF出力</Link>
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={remove}>
            削除
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">科目</span>
              <span>{review.subject}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">問題数</span>
              <span>{review.itemCount}問</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">ステータス</span>
              <Badge variant="outline">{review.status}</Badge>
            </div>
            {review.score !== undefined && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">スコア</span>
                <span className="text-lg font-bold">{review.score}点</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>出題リスト</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>問題</TableHead>
                    <TableHead className="w-24">結果</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {review.items.map((item, index) => (
                    <TableRow key={item.itemId}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.questionText}</TableCell>
                      <TableCell>
                        {item.isCorrect === true && <Badge variant="default">正解</Badge>}
                        {item.isCorrect === false && <Badge variant="destructive">不正解</Badge>}
                        {item.isCorrect === undefined && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
