import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReviewPdf } from '@/hooks/review';

export const ReviewTestPdfPage = () => {
  const { review, isLoading, error, basePath, navigate, id, pdfUrl } = useReviewPdf();

  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;
    window.location.assign(`${pdfUrl}?download=1`);
  }, [pdfUrl]);

  const handlePrint = useCallback(() => {
    if (!pdfUrl) return;

    // ポップアップがブロックされる場合は同一タブで開く
    const win = window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.assign(pdfUrl);
    }
  }, [pdfUrl]);

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
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">PDFプレビュー</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`${basePath}/${id}`)}>
            戻る
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            印刷
          </Button>
          <Button onClick={handleDownload}>
            ダウンロード
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>復習テスト ({review.subject})</CardTitle>
          <CardDescription>印刷・ダウンロード用のプレビューです。内容を確認してください。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <div>作成日: {review.createdDate}</div>
              <div>問題数: {review.items.length}</div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <iframe title="review-test-pdf" src={pdfUrl} className="h-[75vh] w-full bg-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
