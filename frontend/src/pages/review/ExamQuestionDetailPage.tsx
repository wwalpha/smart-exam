import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReviewQuestionDetailPage } from '@/hooks/review';
import { SUBJECT_LABEL } from '@/lib/Consts';
import { formatYmdSlash } from '@/utils/date';

export const ExamQuestionDetailPage = () => {
  const {
    review,
    isLoading,
    error,
    basePath,
    remove,
    ConfirmDialog,
    blocks,
    pdfAvailability,
    previewMaterialPdf,
    complete,
  } = useReviewQuestionDetailPage();

  const infoBadgeClass = 'px-4 py-2 text-sm';

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!review) return <div className="p-8">データの取得に失敗しました。</div>;

  return (
    <div className="space-y-6 px-8">
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">問題復習テスト詳細</h1>
        <div className="flex justify-end gap-2">
          <Button asChild variant="outline" className="w-[100px]">
            <Link to={basePath}>戻る</Link>
          </Button>
          {review.status === 'COMPLETED' ? (
            <Button type="button" className="w-[100px]" disabled>
              結果入力
            </Button>
          ) : (
            <Button asChild className="w-[100px]">
              <Link to={`${basePath}/${review.examId}/grading`}>結果入力</Link>
            </Button>
          )}
          <Button asChild className="w-[100px]">
            <Link to={`${basePath}/${review.examId}/pdf`}>印刷</Link>
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
          <CardHeader>
            <CardTitle>問題リスト</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto">
              <div className="space-y-3">
                {blocks.map((b) => {
                  const materialId = b.materialId;
                  const availability = materialId ? pdfAvailability[materialId] : undefined;
                  const questionPdfOk = !!materialId && !!availability?.QUESTION;
                  const answerPdfOk = !!materialId && !!availability?.ANSWER;

                  return (
                    <div key={b.key} className="rounded border">
                      <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            {b.grade ? (
                              <Badge variant="secondary" className={infoBadgeClass}>
                                {b.grade}年生
                              </Badge>
                            ) : null}
                            {b.provider ? (
                              <Badge variant="secondary" className={infoBadgeClass}>
                                {b.provider}
                              </Badge>
                            ) : null}
                            {b.materialName ? (
                              <Badge variant="secondary" className={infoBadgeClass}>
                                {b.materialName}
                              </Badge>
                            ) : null}
                            {b.materialDate ? (
                              <Badge variant="secondary" className={infoBadgeClass}>
                                {formatYmdSlash(b.materialDate)}
                              </Badge>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!questionPdfOk}
                            onClick={() => {
                              if (!materialId) return;
                              previewMaterialPdf(materialId, 'QUESTION');
                            }}>
                            問題PDF
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!answerPdfOk}
                            onClick={() => {
                              if (!materialId) return;
                              previewMaterialPdf(materialId, 'ANSWER');
                            }}>
                            解答PDF
                          </Button>
                        </div>
                      </div>

                      <div className="p-3">
                        <div className="grid grid-cols-4 gap-2">
                          {b.items.map((item) => (
                            <div key={item.id} className="rounded border px-3 py-2 text-center text-sm font-medium">
                              {item.canonicalKey ?? '-'}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
