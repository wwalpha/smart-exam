import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReviewDetail } from '@/hooks/review';

type ReviewTestStatus = 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'CANCELED';

export const ReviewTestDetailPage = () => {
  const { review, isLoading, error, basePath, remove, updateReviewTestStatus, ConfirmDialog } = useReviewDetail();
  const [statusDraft, setStatusDraft] = useState<ReviewTestStatus>('IN_PROGRESS');

  useEffect(() => {
    if (review) {
      setStatusDraft(review.status);
    }
  }, [review]);

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
              <span className="font-medium">作成日</span>
              <span>{review.createdDate}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">ステータス</span>
              <div className="flex items-center gap-2">
                <Select value={statusDraft} onValueChange={(v) => setStatusDraft(v as ReviewTestStatus)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="ステータス" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                    <SelectItem value="PAUSED">PAUSED</SelectItem>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    <SelectItem value="CANCELED">CANCELED</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  disabled={statusDraft === review.status}
                  onClick={async () => {
                    await updateReviewTestStatus(review.id, { status: statusDraft });
                  }}
                >
                  保存
                </Button>
                <Badge variant="outline" className="ml-2">
                  {review.status}
                </Badge>
              </div>
            </div>
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
