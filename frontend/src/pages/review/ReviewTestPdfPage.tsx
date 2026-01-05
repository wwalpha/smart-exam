import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReviewPdf } from '@/hooks/review';
import { apiRequestBlob } from '@/services/apiClient';
import { toast } from 'sonner';

export const ReviewTestPdfPage = () => {
  const { review, isLoading, error, basePath, navigate, id, pdfUrl } = useReviewPdf();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!pdfUrl) return;

    let aborted = false;

    const run = async () => {
      try {
        setIsFetching(true);
        const blob = await apiRequestBlob({ method: 'GET', path: pdfUrl });
        if (aborted) return;
        const nextUrl = URL.createObjectURL(blob);
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return nextUrl;
        });
      } catch (e) {
        toast.error('PDFの取得に失敗しました', {
          description: e instanceof Error ? e.message : undefined,
        });
      } finally {
        setIsFetching(false);
      }
    };

    run();

    return () => {
      aborted = true;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return '';
      });
    };
  }, [pdfUrl]);

  const handleDownload = useCallback(() => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `review-test-${id ?? 'unknown'}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [blobUrl, id]);

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
          <Button variant="outline" onClick={handlePrint} disabled={!blobUrl || isFetching}>
            印刷
          </Button>
          <Button onClick={handleDownload} disabled={!blobUrl || isFetching}>
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
              <iframe
                ref={iframeRef}
                title="review-test-pdf"
                src={blobUrl}
                className="h-[75vh] w-full bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
