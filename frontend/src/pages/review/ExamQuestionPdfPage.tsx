import { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReviewQuestionPdf } from '@/hooks/review';
import { toast } from 'sonner';

export const ExamQuestionPdfPage = () => {
  const { review, isLoading, error, basePath, navigate, id, presignedUrl, isFetchingPdfUrl, pdfUrlError } =
    useReviewQuestionPdf();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const handleDownload = useCallback(() => {
    if (!presignedUrl) return;
    const a = document.createElement('a');
    a.href = presignedUrl;
    a.download = `review-test-${id ?? 'unknown'}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [presignedUrl, id]);

  const handlePrint = useCallback(() => {
    const frame = iframeRef.current;
    if (!frame) return;

    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch (e) {
      toast.error('PDFの印刷に失敗しました', {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }, []);

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!review) return <div className="p-8">データの取得に失敗しました。</div>;
  if (pdfUrlError) return <div className="p-8 text-red-500">{pdfUrlError}</div>;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">印刷</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="w-[100px]" onClick={() => navigate(`${basePath}/${id}`)}>
            戻る
          </Button>
          <Button
            variant="outline"
            className="w-[100px]"
            onClick={handlePrint}
            disabled={!presignedUrl || isFetchingPdfUrl}>
            印刷
          </Button>
          <Button className="w-[100px]" onClick={handleDownload} disabled={!presignedUrl || isFetchingPdfUrl}>
            ダウンロード
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>復習テスト</CardTitle>
          <CardDescription>印刷・ダウンロード用のプレビューです。内容を確認してください。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <div>作成日: {review.createdDate}</div>
              <div>問題数: {review.items.length}</div>
            </div>

            <div className="rounded-md border overflow-hidden">
              {presignedUrl ? (
                <iframe
                  ref={iframeRef}
                  title="review-test-pdf"
                  src={presignedUrl}
                  className="h-[75vh] w-full bg-white"
                />
              ) : (
                <div className="flex h-[75vh] items-center justify-center text-sm text-muted-foreground">
                  {isFetchingPdfUrl ? 'PDFを読み込み中...' : 'PDFの読み込みに失敗しました。'}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
