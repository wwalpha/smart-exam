import { Button } from '@/components/ui/button';
import { useReviewPdf } from '@/hooks/review';

export const ReviewTestPdfPage = () => {
  const { review, isLoading, basePath, pdfUrl, navigate, id } = useReviewPdf();

  if (isLoading || !review) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(`${basePath}/${id}`)}>
            戻る
          </Button>
          <h1 className="text-lg font-bold">{review.testId} - PDFプレビュー</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.print()}>印刷</Button>
          <Button variant="secondary" onClick={() => window.open(pdfUrl, '_blank')}>
            ダウンロード
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-gray-100 p-8 overflow-auto flex justify-center">
        <div className="bg-white shadow-lg w-[210mm] min-h-[297mm] p-[20mm] box-border">
          {/* This is a HTML representation of what the PDF might look like */}
          <div className="text-center border-b-2 border-black pb-4 mb-8">
            <h2 className="text-2xl font-bold mb-2">復習テスト ({review.subject})</h2>
            <div className="flex justify-between text-sm">
              <span>ID: {review.testId}</span>
              <span>作成日: {new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="space-y-8">
            {review.items.map((item, index) => (
              <div key={item.itemId} className="flex gap-4 border-b border-gray-200 pb-4 break-inside-avoid">
                <div className="font-bold w-8">{index + 1}.</div>
                <div className="flex-1">
                  <div className="text-lg mb-4">{item.questionText}</div>
                  {/* Space for answer */}
                  <div className="h-24 border border-gray-300 rounded p-2 bg-gray-50"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
