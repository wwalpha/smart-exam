import { Link } from 'react-router-dom';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReviewDetail } from '@/hooks/review';
import { formatYmdHmSlash } from '@/utils/date';
import { SUBJECT_LABEL } from '@/lib/Consts';

export const ReviewTestDetailPage = () => {
  const { review, isLoading, error, basePath, remove, updateReviewTestStatus, ConfirmDialog } = useReviewDetail();
  const complete = useCallback(async () => {
    if (!review) return;
    await updateReviewTestStatus(review.id, { status: 'COMPLETED' });
  }, [review, updateReviewTestStatus]);

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
            <Link to={`${basePath}/${review.id}/pdf`}>PDFプレビュー</Link>
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={review.status === 'COMPLETED'}
            onClick={complete}
          >
            完了
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={remove}>
            削除
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 border-b pb-3 md:grid-cols-2">
              <div className="flex justify-between">
                <span className="font-medium">科目</span>
                <span>
                  {review.mode === 'KANJI'
                    ? '漢字'
                    : (SUBJECT_LABEL[review.subject as keyof typeof SUBJECT_LABEL] ?? '')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">問題数</span>
                <span>{review.itemCount}問</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">作成日時</span>
                <span>{formatYmdHmSlash(review.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">ステータス</span>
                <Badge variant="outline">{review.status}</Badge>
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
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {review.items.map((item, index) => (
                  <div key={item.id} className="rounded border px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          {index + 1}. {item.questionText}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {item.isCorrect === true && <Badge variant="default">正解</Badge>}
                        {item.isCorrect === false && <Badge variant="destructive">不正解</Badge>}
                        {item.isCorrect === undefined && <span className="text-muted-foreground">-</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
