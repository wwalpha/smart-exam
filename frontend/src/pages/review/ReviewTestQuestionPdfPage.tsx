import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReviewQuestionPdf } from '@/hooks/review';
import { apiRequestBlob } from '@/services/apiClient';
import { toast } from 'sonner';

const isPdfBlob = async (blob: Blob): Promise<boolean> => {
  const prefix = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  return (
    prefix.length === 5 &&
    prefix[0] === 0x25 &&
    prefix[1] === 0x50 &&
    prefix[2] === 0x44 &&
    prefix[3] === 0x46 &&
    prefix[4] === 0x2d
  );
};

export const ReviewTestQuestionPdfPage = () => {
  const { review, isLoading, error, basePath, navigate, id, pdfUrl } = useReviewQuestionPdf();
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

        if (!(await isPdfBlob(blob))) {
          const text = await blob.text().catch(() => '');
          toast.error('PDFの生成に失敗しました', {
            description: text ? text.slice(0, 200) : undefined,
          });
          return;
        }

        const pdfBlob = blob.slice(0, blob.size, 'application/pdf');

        const nextUrl = URL.createObjectURL(pdfBlob);
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

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!review) return <div className="p-8">データの取得に失敗しました。</div>;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">印刷</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="w-[100px]" onClick={() => navigate(`${basePath}/${id}`)}>
            戻る
          </Button>
          <Button variant="outline" className="w-[100px]" onClick={handlePrint} disabled={!blobUrl || isFetching}>
            印刷
          </Button>
          <Button className="w-[100px]" onClick={handleDownload} disabled={!blobUrl || isFetching}>
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
              {blobUrl ? (
                <iframe ref={iframeRef} title="review-test-pdf" src={blobUrl} className="h-[75vh] w-full bg-white" />
              ) : (
                <div className="flex h-[75vh] items-center justify-center text-sm text-muted-foreground">
                  {isFetching ? 'PDFを読み込み中...' : 'PDFの読み込みに失敗しました。'}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
