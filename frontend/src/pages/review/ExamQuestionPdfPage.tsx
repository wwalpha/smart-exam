import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useReviewQuestionPdf } from '@/hooks/review';

export const ExamQuestionPdfPage = () => {
  const { review, isLoading, error, basePath, navigate, id, presignedUrl, isFetchingPdfUrl, pdfUrlError } =
    useReviewQuestionPdf();

  const handleDownload = useCallback(() => {
    if (!presignedUrl) return;
    const a = document.createElement('a');
    a.href = presignedUrl;
    a.download = `review-test-${id ?? 'unknown'}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [presignedUrl, id]);

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!review) return <div className="p-8">データの取得に失敗しました。</div>;
  if (pdfUrlError) return <div className="p-8 text-red-500">{pdfUrlError}</div>;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <Button variant="outline" className="w-[100px]" onClick={() => navigate(`${basePath}/${id}`)}>
            戻る
          </Button>
          <Button className="w-[100px]" onClick={handleDownload} disabled={!presignedUrl || isFetchingPdfUrl}>
            ダウンロード
          </Button>
        </div>
      </div>
      <div className="border overflow-hidden">
        {presignedUrl ? (
          <iframe title="review-test-pdf" src={presignedUrl} className="h-[75vh] w-full bg-white" />
        ) : (
          <div className="flex h-[75vh] items-center justify-center text-sm text-muted-foreground">
            {isFetchingPdfUrl ? 'PDFを読み込み中...' : 'PDFの読み込みに失敗しました。'}
          </div>
        )}
      </div>
    </div>
  );
};
