import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReviewAttemptHistory } from '@/hooks/review';
import { useWordTestStore } from '@/stores';

export const KanjiAttemptHistoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const { detail, status } = useWordTestStore((s) => s.kanji);
  const fetchKanji = useWordTestStore((s) => s.fetchKanji);

  useEffect(() => {
    if (id) fetchKanji(id);
  }, [id, fetchKanji]);

  const history = useReviewAttemptHistory({
    targetType: 'KANJI',
    targetId: id ?? null,
    subject: detail?.subject ?? null,
    enabled: Boolean(id && detail),
  });

  const {
    register: registerHistory,
    formState: { errors: historyErrors },
  } = history.form;

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
          <div className="text-sm text-muted-foreground">
            {detail ? `${detail.kanji} / ${detail.reading ?? ''}` : id}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/kanji/${id}`}>戻る</Link>
          </Button>
          <Button type="button" variant="outline" onClick={history.startAdd} disabled={history.isLoading || !detail}>
            追加
          </Button>
        </div>
      </div>

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
                <TableHead>メモ</TableHead>
                <TableHead className="w-[180px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.attempts.map((a) => (
                <TableRow key={a.attemptedAt}>
                  <TableCell>{a.dateYmd}</TableCell>
                  <TableCell>{a.isCorrect ? '正解' : '不正解'}</TableCell>
                  <TableCell className="truncate" title={a.memo ?? ''}>
                    {a.memo ?? ''}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => history.startEdit(a)}>
                        変更
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => history.remove(a.dateYmd)}
                        disabled={history.isLoading}>
                        削除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {history.attempts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    履歴がありません
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={history.isOpen} onOpenChange={history.setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>履歴を保存</DialogTitle>
          </DialogHeader>
          <form onSubmit={history.submit} className="space-y-4">
            <div className="space-y-2">
              <Label>実施日 *</Label>
              <Input
                type="date"
                {...registerHistory('dateYmd', { required: '必須です' })}
                aria-invalid={!!historyErrors.dateYmd}
                className={historyErrors.dateYmd ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {historyErrors.dateYmd?.message ? (
                <p className="text-sm text-destructive">{String(historyErrors.dateYmd.message)}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" {...registerHistory('isCorrect')} className="h-4 w-4" />
              <span className="text-sm">正解</span>
            </div>

            <div className="space-y-2">
              <Label>メモ</Label>
              <Input {...registerHistory('memo')} placeholder="任意" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => history.setIsOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={history.isLoading || !detail}>
                保存
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
