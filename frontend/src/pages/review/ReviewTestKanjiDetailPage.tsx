import { Link, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReviewKanjiDetail } from '@/hooks/review';
import { SUBJECT_LABEL } from '@/lib/Consts';
import { formatYmdSlash } from '@/utils/date';

export const ReviewTestKanjiDetailPage = () => {
  const { review, isLoading, error, basePath, remove, updateReviewTestStatus, ConfirmDialog } = useReviewKanjiDetail();
  const navigate = useNavigate();

  const infoBadgeClass = 'px-4 py-2 text-sm';

  const complete = useCallback(async () => {
    if (!review) return;
    await updateReviewTestStatus(review.id, { status: 'COMPLETED' });
    navigate(basePath);
  }, [review, updateReviewTestStatus, navigate, basePath]);

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!review) return <div className="p-8">データの取得に失敗しました。</div>;

  return (
    <div className="space-y-6 px-8">
      <ConfirmDialog />
      <div className="flex items-center justify-end">
        <div className="flex justify-end gap-2">
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
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className={infoBadgeClass}>
                {SUBJECT_LABEL[review.subject as keyof typeof SUBJECT_LABEL] ?? ''}
              </Badge>
              <Badge variant="secondary" className={infoBadgeClass}>
                {formatYmdSlash(review.createdDate)}
              </Badge>
              <Badge variant="secondary" className={infoBadgeClass}>
                {review.count}問
              </Badge>
              <Badge variant="secondary" className={infoBadgeClass}>
                {review.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 pl-6">
                {review.items.map((item) => (
                  <div key={item.id} className="rounded border px-3 py-2 text-left text-sm font-medium">
                    {item.questionText}
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
