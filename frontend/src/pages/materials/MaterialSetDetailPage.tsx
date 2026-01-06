import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMaterialDetail } from '@/hooks/materials';
import { SUBJECT_LABEL } from '@/lib/Consts';

type PdfFileType = 'QUESTION' | 'ANSWER' | 'GRADED_ANSWER';

const PDF_FILE_TYPES: PdfFileType[] = ['QUESTION', 'ANSWER', 'GRADED_ANSWER'];

export const MaterialSetDetailPage = () => {
  const { material, filesByType, isLoading, error, id, fileTypeLabel, previewFile, replacePdf } = useMaterialDetail();
  const fileInputRefs = useRef<Partial<Record<PdfFileType, HTMLInputElement | null>>>({});

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!material) {
    return <div className="p-8">データの取得に失敗しました。</div>;
  }

  return (
    <div className="space-y-6 px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{material.name}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/materials">一覧へ戻る</Link>
          </Button>
          <Button asChild>
            <Link to={`/materials/${id}/questions`}>問題管理</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">学年</div>
              <div>{material.grade}年</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">教材種別</div>
              <div>{material.provider}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">科目</div>
              <Badge variant="outline">{SUBJECT_LABEL[material.subject as keyof typeof SUBJECT_LABEL] ?? ''}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">実施年月日</div>
              <div>{material.yearMonth || '-'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">教材名</div>
              <div className="text-lg font-medium">{material.name}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ファイル一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {PDF_FILE_TYPES.map((fileType) => {
              const file = filesByType[fileType];

              return (
                <div key={fileType} className="flex flex-col gap-2 border p-3 rounded-md sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-medium">{fileTypeLabel(fileType)}</div>
                    <div className="text-sm text-muted-foreground truncate">{file?.filename ?? '未登録'}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <input
                      ref={(el) => {
                        fileInputRefs.current[fileType] = el;
                      }}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void replacePdf(fileType, f);
                        e.target.value = '';
                      }}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-[100px]"
                      onClick={() => file && previewFile(file.id)}
                      disabled={!file}>
                      プレビュー
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-[100px]"
                      onClick={() => fileInputRefs.current[fileType]?.click()}>
                      アップロード
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
