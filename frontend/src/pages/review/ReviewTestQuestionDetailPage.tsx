import { Link, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReviewQuestionDetail } from '@/hooks/review';
import { SUBJECT_LABEL } from '@/lib/Consts';
import { apiRequestBlob } from '@/services/apiClient';
import * as MATERIAL_API from '@/services/materialApi';
import { formatYmdSlash } from '@/utils/date';
import { toast } from 'sonner';
import type { MaterialFile } from '@smart-exam/api-types';

const isPdfBlob = async (blob: Blob): Promise<boolean> => {
  const prefix = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...prefix) === '%PDF-';
};

const pickLatestPdf = (files: MaterialFile[], fileType: MaterialFile['fileType']): MaterialFile | null => {
  const candidates = files.filter((f) => f.fileType === fileType);
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
};

export const ReviewTestQuestionDetailPage = () => {
  const { review, isLoading, error, basePath, remove, updateReviewTestStatus, ConfirmDialog } = useReviewQuestionDetail();
  const navigate = useNavigate();

  const complete = useCallback(async () => {
    if (!review) return;
    await updateReviewTestStatus(review.id, { status: 'COMPLETED' });
    navigate(basePath);
  }, [review, updateReviewTestStatus, navigate, basePath]);

  const previewMaterialPdf = useCallback(async (materialId: string, fileType: MaterialFile['fileType']) => {
    try {
      const files = await MATERIAL_API.listMaterialFiles(materialId);
      const target = pickLatestPdf(files, fileType);
      if (!target) {
        toast.error('PDFが見つかりません');
        return;
      }

      const blob = await apiRequestBlob({
        method: 'GET',
        path: `/api/materials/${encodeURIComponent(materialId)}/files/${encodeURIComponent(target.id)}`,
      });

      if (!(await isPdfBlob(blob))) {
        const text = await blob.text().catch(() => '');
        toast.error('PDFの取得に失敗しました', { description: text.slice(0, 200) });
        return;
      }

      const pdfBlob = blob.slice(0, blob.size, 'application/pdf');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('PDFの取得に失敗しました');
    }
  }, []);

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!review) return <div className="p-8">データの取得に失敗しました。</div>;

  return (
    <div className="space-y-6 px-8">
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">問題復習テスト詳細</h1>
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
                <span className="flex-1 text-left">{SUBJECT_LABEL[review.subject as keyof typeof SUBJECT_LABEL] ?? ''}</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-24 shrink-0 font-medium">問題数</span>
                <span className="flex-1 text-left">{review.count}問</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-24 shrink-0 font-medium">作成日時</span>
                <span className="flex-1 text-left">{formatYmdSlash(review.createdDate)}</span>
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
              {(() => {
                const entries = review.items.map((item, index) => ({ item, no: index + 1 }));

                const blocks: Array<{
                  key: string;
                  grade: string;
                  provider: string;
                  materialDate: string;
                  materialName: string;
                  materialId: string | null;
                  items: typeof entries;
                }> = [];
                const byKey = new Map<string, (typeof blocks)[number]>();

                for (const e of entries) {
                  const grade = e.item.grade ?? '';
                  const provider = e.item.provider ?? '';
                  const materialDate = e.item.materialDate ?? '';
                  const materialName = e.item.materialName ?? '';
                  const key = [grade, provider, materialDate, materialName].join('||');

                  const existing = byKey.get(key);
                  if (existing) {
                    existing.items.push(e);
                    continue;
                  }

                  const created = {
                    key,
                    grade,
                    provider,
                    materialDate,
                    materialName,
                    materialId: e.item.materialId ?? null,
                    items: [e],
                  };
                  byKey.set(key, created);
                  blocks.push(created);
                }

                return (
                  <div className="space-y-3">
                    {blocks.map((b) => (
                      <div key={b.key} className="rounded border">
                        <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium">
                              {[b.grade, b.provider, b.materialDate ? formatYmdSlash(b.materialDate) : '', b.materialName]
                                .filter((v) => String(v).trim().length > 0)
                                .join(' ')}
                            </div>
                          </div>
                          {b.materialId ? (
                            <div className="flex shrink-0 gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => previewMaterialPdf(b.materialId as string, 'QUESTION')}>
                                問題PDF
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => previewMaterialPdf(b.materialId as string, 'ANSWER')}>
                                解答PDF
                              </Button>
                            </div>
                          ) : null}
                        </div>

                        <div className="p-3">
                          <div className="space-y-2">
                            {b.items.map(({ item, no }) => (
                              <div key={item.id} className="flex items-start justify-between gap-3 rounded border px-3 py-2">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium">
                                    {no}. {item.canonicalKey ?? item.questionText ?? item.displayLabel ?? '-'}
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  {item.isCorrect === true && <Badge variant="default">正解</Badge>}
                                  {item.isCorrect === false && <Badge variant="destructive">不正解</Badge>}
                                  {item.isCorrect === undefined && <span className="text-muted-foreground">-</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
