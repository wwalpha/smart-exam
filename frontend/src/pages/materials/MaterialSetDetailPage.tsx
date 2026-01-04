import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMaterialDetail } from '@/hooks/materials';

export const MaterialSetDetailPage = () => {
  const { material, files, isLoading, error, id } = useMaterialDetail();
  const safeFiles = Array.isArray(files) ? files : [];

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
              <div className="text-sm font-medium text-muted-foreground">教材名</div>
              <div className="text-lg font-medium">{material.name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">科目</div>
              <Badge variant="outline">{material.subject}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">教材年月</div>
              <div>{material.yearMonth || '-'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">学年</div>
              <div>{material.grade}年</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">教材種別</div>
              <div>{material.provider}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">回・テスト名</div>
              <div>{material.testType}</div>
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
            {safeFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between border p-3 rounded-md">
                <div>
                  <div className="font-medium">{file.fileType}</div>
                  <div className="text-sm text-muted-foreground">{file.filename}</div>
                </div>
                <Button variant="ghost" size="sm">
                  プレビュー
                </Button>
              </div>
            ))}
            {safeFiles.length === 0 && <div className="text-muted-foreground">ファイルが登録されていません</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
