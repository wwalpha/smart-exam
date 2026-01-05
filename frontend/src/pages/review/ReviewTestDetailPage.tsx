import { Link, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReviewDetail } from '@/hooks/review';
import { formatYmdHmSlash } from '@/utils/date';
import { SUBJECT_LABEL } from '@/lib/Consts';

export const ReviewTestDetailPage = () => {
  const { review, isLoading, error, basePath, remove, updateReviewTestStatus, ConfirmDialog } = useReviewDetail();
  const navigate = useNavigate();

  const complete = useCallback(async () => {
    if (!review) return;
    await updateReviewTestStatus(review.id, { status: 'COMPLETED' });
    navigate(basePath);
  }, [review, updateReviewTestStatus, navigate, basePath]);

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
    <div className="space-y-6 px-8">
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold"></h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="w-[100px]">
            <Link to={basePath}>戻る</Link>
          </Button>
          <Button asChild className="w-[100px]">
            <Link to={`${basePath}/${review.id}/grading`}>結果入力</Link>
          </Button>

          <Button asChild className="w-[100px]">
            <Link to={`${basePath}/${review.id}/pdf`}>印刷</Link>
          </Button>

          {review.status !== 'COMPLETED' ? (
            <Button type="button" variant="default" className="w-[100px]" onClick={complete}>
              完了
            </Button>
          ) : null}

          <Button
            variant="outline"
            className="w-[100px] text-destructive hover:bg-destructive/10 hover:text-destructive"
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex items-start gap-4">
                <span className="w-24 shrink-0 font-medium">科目</span>
                <span className="flex-1 text-left">
                  {SUBJECT_LABEL[review.subject as keyof typeof SUBJECT_LABEL] ?? ''}
                </span>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-24 shrink-0 font-medium">問題数</span>
                <span className="flex-1 text-left">{review.itemCount}問</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-24 shrink-0 font-medium">作成日時</span>
                <span className="flex-1 text-left">{formatYmdHmSlash(review.createdAt)}</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-24 shrink-0 font-medium">ステータス</span>
                <div className="flex-1 text-left">
                  <Badge variant="outline">{review.status}</Badge>
                </div>
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
                        {item.isCorrect === true && (
                          <Badge
                            variant="default"
                            className={
                              review.mode === 'KANJI'
                                ? 'border-transparent bg-emerald-600 text-white hover:bg-emerald-600/90'
                                : undefined
                            }>
                            正解
                          </Badge>
                        )}
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
