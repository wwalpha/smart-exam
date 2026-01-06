import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReviewAttemptHistory, useReviewCandidateForTarget } from '@/hooks/review';
import { useWordTestStore } from '@/stores';

export const KanjiAttemptHistoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const { detail, status } = useWordTestStore((s) => s.kanji);
  const fetchKanji = useWordTestStore((s) => s.fetchKanji);

  useEffect(() => {
    if (id) void fetchKanji(id);
  }, [id, fetchKanji]);

  const history = useReviewAttemptHistory({
    targetType: 'KANJI',
    targetId: id ?? null,
    subject: detail?.subject ?? null,
    enabled: Boolean(id && detail),
  });

  const candidateState = useReviewCandidateForTarget({
    mode: 'KANJI',
    targetId: id ?? null,
    subject: detail?.subject ?? null,
    enabled: Boolean(id && detail),
  });

  const headerSub = useMemo(() => {
    if (detail) return `${detail.kanji} / ${detail.reading ?? ''}`;
    return id ?? '';
  }, [detail, id]);

  if (status.isLoading && !detail) {
    return <div className="p-8">Loading...</div>;
  }

  if (!id) {
    return <div className="p-8">IDが不正です。</div>;
  }

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">漢字テスト履歴</h1>
          <div className="text-sm text-muted-foreground">{headerSub}</div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/kanji/${id}`}>戻る</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>候補情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {candidateState.error ? <div className="text-destructive">{candidateState.error}</div> : null}
          <div>
            次回日付: <span className="font-medium">{candidateState.candidate?.nextTime ?? '-'}</span>
          </div>
          <div>
            ロック: <span className="font-medium">{candidateState.candidate?.testId ?? '-'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>履歴一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {history.error ? <div className="mb-3 text-sm text-destructive">{history.error}</div> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">実施日</TableHead>
                <TableHead className="w-[100px]">正誤</TableHead>
                <TableHead>復習テストID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.attempts.map((a) => (
                <TableRow key={`${a.reviewTestId ?? ''}#${a.dateYmd}`}>
                  <TableCell>{a.dateYmd}</TableCell>
                  <TableCell>{a.isCorrect ? '正解' : '不正解'}</TableCell>
                  <TableCell className="text-muted-foreground">{a.reviewTestId ?? '-'}</TableCell>
                </TableRow>
              ))}
              {history.attempts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    履歴がありません
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
