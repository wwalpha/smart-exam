import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMaterialDetail } from '@/hooks/materials';
import { apiRequestBlob } from '@/services/apiClient';
import { toast } from 'sonner';
import { SUBJECT_LABEL } from '@/lib/Consts';

const isPdfBlob = async (blob: Blob): Promise<boolean> => {
  const prefix = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...prefix) === '%PDF-';
};

const fileTypeLabel = (fileType: string): string => {
  if (fileType === 'QUESTION') return '問題';
  if (fileType === 'ANSWER') return '解答';
  if (fileType === 'GRADED_ANSWER') return '採点済み答案';
  return fileType;
};

export const MaterialSetDetailPage = () => {
  const { material, files, isLoading, error, id } = useMaterialDetail();

  const preview = async (key: string) => {
    try {
      const blob = await apiRequestBlob({
        method: 'GET',
        path: `/api/material-files?key=${encodeURIComponent(key)}`,
      });

      if (!(await isPdfBlob(blob))) {
        const text = await blob.text().catch(() => '');
        toast.error('PDFの取得に失敗しました', { description: text.slice(0, 200) });
        return;
      }

      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast.error('PDFの取得に失敗しました');
    }
  };

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
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">教材セット詳細</h1>
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
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between border p-3 rounded-md">
                <div>
                  <div className="font-medium">{fileTypeLabel(file.fileType)}</div>
                  <div className="text-sm text-muted-foreground">{file.filename}</div>
                </div>
                <Button variant="outline" size="sm" className="w-[100px]" onClick={() => preview(file.s3Key)}>
                  プレビュー
                </Button>
              </div>
            ))}
            {files.length === 0 && <div className="text-muted-foreground">ファイルが登録されていません</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
