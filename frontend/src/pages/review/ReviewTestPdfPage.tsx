import { useCallback, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useReviewPdf } from '@/hooks/review';
import { toast } from 'sonner';

function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

const kanjiPlaceholderText = '問題：＿＿＿';

export const ReviewTestPdfPage = () => {
  const { review, isLoading, error, basePath, navigate, id, isKanji } = useReviewPdf();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const questionTexts = useMemo<string[]>(() => {
    if (!review) return [];

    if (isKanji) {
      return review.items.map(() => kanjiPlaceholderText);
    }

    return review.items.map((item) => `問題：${item.questionText ?? ''}`);
  }, [isKanji, review]);

  const pages = useMemo(() => {
    if (!isKanji) return [{ columns: [questionTexts] }];

    const perPage = 60;
    const perColumn = 20;
    return chunk(questionTexts, perPage).map((pageItems) => {
      const cols = chunk(pageItems, perColumn);
      const padded = [...cols];
      while (padded.length < 3) padded.push([]);
      return { columns: padded.slice(0, 3) };
    });
  }, [isKanji, questionTexts]);

  const ensureHtml2Pdf = useCallback(async () => {
    const mod = await import('html2pdf.js');
    return mod.default;
  }, []);

  const buildFileName = useCallback(() => {
    const date = review?.createdDate ?? 'unknown-date';
    const prefix = isKanji ? 'kanji-review-test' : 'review-test';
    return `${prefix}-${date}.pdf`;
  }, [isKanji, review?.createdDate]);

  const generatePdfBlob = useCallback(async (): Promise<Blob> => {
    if (!previewRef.current) {
      throw new Error('PDFの生成対象が見つかりません');
    }

    const html2pdf = await ensureHtml2Pdf();
    const worker = html2pdf()
      .set({
        margin: 8,
        filename: buildFileName(),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: isKanji ? 'landscape' : 'portrait',
        },
        pagebreak: { mode: ['css', 'legacy'] },
      } as any)
      .from(previewRef.current);

    const blob: Blob = await worker.toPdf().output('blob');
    return blob;
  }, [buildFileName, ensureHtml2Pdf, isKanji]);

  const handleDownload = useCallback(async () => {
    try {
      setIsGenerating(true);
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = buildFileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('PDFのダウンロードに失敗しました', {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [buildFileName, generatePdfBlob, toast]);

  const handlePrint = useCallback(async () => {
    try {
      setIsGenerating(true);
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);

      const win = window.open('', '_blank', 'noopener,noreferrer');
      if (!win) {
        throw new Error('ポップアップがブロックされました');
      }

      win.document.open();
      win.document.write(`<!doctype html><html><head><title>print</title></head><body style="margin:0">
<iframe id="pdf" src="${url}" style="border:0;width:100vw;height:100vh"></iframe>
<script>
  const iframe = document.getElementById('pdf');
  iframe.addEventListener('load', () => {
    setTimeout(() => { window.print(); }, 200);
  });
<\/script>
</body></html>`);
      win.document.close();

      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      toast.error('PDFの印刷に失敗しました', {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [generatePdfBlob, toast]);

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
          <Button variant="outline" onClick={handlePrint} disabled={isGenerating}>
            印刷
          </Button>
          <Button onClick={handleDownload} disabled={isGenerating}>
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

            <div ref={previewRef} className="rounded border bg-white p-6 text-black">
              <div className="mb-4 flex items-end justify-between">
                <div className="text-lg font-semibold">復習テスト</div>
                <div className="text-sm">{review.createdDate}</div>
              </div>

              {isKanji ? (
                <div className="space-y-10">
                  {pages.map((page, pageIndex) => (
                    <div key={pageIndex}>
                      <div className="grid grid-cols-3 gap-6">
                        {page.columns.map((col, colIndex) => (
                          <div key={colIndex} className="space-y-3">
                            {col.map((text, rowIndex) => (
                              <div key={rowIndex} className="text-sm">
                                <span className="mr-2 inline-block w-6 text-right">
                                  {pageIndex * 60 + colIndex * 20 + rowIndex + 1}.
                                </span>
                                <span>{text}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      {pageIndex < pages.length - 1 && <div className="html2pdf__page-break" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {questionTexts.map((text, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="mr-2 inline-block w-6 text-right">{idx + 1}.</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
