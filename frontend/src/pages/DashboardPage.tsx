import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/hooks/useDashboard';

/**
 * ダッシュボード画面
 */
export const DashboardPage = () => {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!data) {
    return <div className="p-8">データの取得に失敗しました。</div>;
  }

  const topIncorrectQuestions = Array.isArray(data.topIncorrectQuestions) ? data.topIncorrectQuestions : [];
  const topIncorrectKanji = Array.isArray(data.topIncorrectKanji) ? data.topIncorrectKanji : [];

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日のテスト予定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.todayTestCount}件</div>
            <p className="text-xs text-muted-foreground">実施予定の復習テスト</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">在庫数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.inventoryCount}件</div>
            <p className="text-xs text-muted-foreground">テスト生成可能な問題・漢字</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>不正解率が高い問題 (Top 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topIncorrectQuestions.map((q) => (
                <div key={q.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <div className="font-medium">{q.displayLabel}</div>
                    <div className="text-sm text-muted-foreground">{q.subject}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-500">{(q.incorrectRate * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
              {topIncorrectQuestions.length === 0 && (
                <div className="text-sm text-muted-foreground">データがありません</div>
              )}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link to="/reviewtests/questions">問題テスト一覧へ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>不正解率が高い漢字 (Top 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topIncorrectKanji.map((k) => (
                <div key={k.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <div className="font-medium text-lg">{k.kanji}</div>
                    <div className="text-sm text-muted-foreground">{k.subject}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-500">{(k.incorrectRate * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
              {topIncorrectKanji.length === 0 && (
                <div className="text-sm text-muted-foreground">データがありません</div>
              )}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link to="/reviewtests/kanji">漢字テスト一覧へ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
