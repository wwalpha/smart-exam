import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

type PdfAvailability = {
  QUESTION: boolean;
  ANSWER: boolean;
};

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
  const { review, isLoading, error, basePath, remove, updateReviewTestStatus, ConfirmDialog } =
    useReviewQuestionDetail();
  const navigate = useNavigate();

  const infoBadgeClass = 'px-4 py-2 text-sm';

  const blocks = useMemo(() => {
    if (!review) return [];

    const entries = review.items;
    const result: Array<{
      key: string;
      grade: string;
      provider: string;
      materialDate: string;
      materialName: string;
      materialId: string | null;
      items: typeof entries;
    }> = [];
    const byKey = new Map<string, (typeof result)[number]>();

    for (const item of entries) {
      const grade = item.grade ?? '';
      const provider = item.provider ?? '';
      const materialDate = item.materialDate ?? '';
      const materialName = item.materialName ?? '';
      const key = [grade, provider, materialDate, materialName].join('||');

      const existing = byKey.get(key);
      if (existing) {
        existing.items.push(item);
        continue;
      }

      const created = {
        key,
        grade,
        provider,
        materialDate,
        materialName,
        materialId: item.materialId ?? null,
        items: [item],
      };
      byKey.set(key, created);
      result.push(created);
    }

    return result;
  }, [review]);

  const [pdfAvailability, setPdfAvailability] = useState<Record<string, PdfAvailability>>({});

  useEffect(() => {
    if (!review) return;

    let cancelled = false;

    const uniqueMaterialIds = Array.from(
      new Set(blocks.map((b) => b.materialId).filter((x): x is string => typeof x === 'string' && x.length > 0))
    );

    const run = async () => {
      const next: Record<string, PdfAvailability> = {};
      for (const materialId of uniqueMaterialIds) {
        try {
          const files = await MATERIAL_API.listMaterialFiles(materialId);
          next[materialId] = {
            QUESTION: files.some((f) => f.fileType === 'QUESTION'),
            ANSWER: files.some((f) => f.fileType === 'ANSWER'),
          };
        } catch {
          next[materialId] = { QUESTION: false, ANSWER: false };
        }
      }

      if (cancelled) return;
      setPdfAvailability(next);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [review, blocks]);

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
