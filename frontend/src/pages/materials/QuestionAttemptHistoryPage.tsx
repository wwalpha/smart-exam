import { useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuestionAttemptHistory } from '@/hooks/materials';
import { useWordTestStore } from '@/stores';
import { compareQuestionNumber } from '@/utils/questionNumber';

export const QuestionAttemptHistoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialQuestionId = searchParams.get('questionId');

  const { detail: material, questions, status } = useWordTestStore((s) => s.material);
  const fetchMaterialSet = useWordTestStore((s) => s.fetchMaterialSet);
  const fetchQuestions = useWordTestStore((s) => s.fetchQuestions);

  useEffect(() => {
    if (!id) return;
    fetchMaterialSet(id);
    fetchQuestions(id);
  }, [id, fetchMaterialSet, fetchQuestions]);

  const sorted = useMemo(() => {
    return [...questions].sort((a, b) => compareQuestionNumber(a.canonicalKey, b.canonicalKey));
  }, [questions]);

  const history = useQuestionAttemptHistory({
    subject: material?.subject ?? null,
    questions: sorted,
  });

  useEffect(() => {
    if (!initialQuestionId) return;
    if (!history.isOpen) {
      history.openForQuestion(initialQuestionId);
    }
  }, [initialQuestionId, history]);

  const {
    register: registerHistory,
    formState: { errors: historyErrors },
  } = history.form;

  if (status.isLoading && !material) {
    return <div className="p-8">Loading...</div>;
  }

  if (!id) {
    return <div className="p-8">IDが不正です。</div>;
  }

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">問題テスト履歴</h1>
          <div className="text-sm text-muted-foreground">{material?.name ?? id}</div>
        </div>
        <Button asChild variant="outline">
          <Link to={`/materials/${id}/questions`}>戻る</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>問題一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">問題番号</TableHead>
                <TableHead />
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>{q.canonicalKey}</TableCell>
                  <TableCell className="text-muted-foreground">{q.id}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => history.openForQuestion(q.id)}>
                      履歴
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    問題がありません
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={history.isOpen}
        onOpenChange={(open) => {
          if (!open) history.close();
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>履歴: {history.selectedQuestion?.canonicalKey ?? ''}</DialogTitle>
          </DialogHeader>

          {history.error ? <div className="text-sm text-destructive">{history.error}</div> : null}

          <div className="space-y-3">
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
                    <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                      履歴がありません
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>

            <form onSubmit={history.submit} className="space-y-3">
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
                <Button type="button" variant="outline" onClick={history.close}>
                  閉じる
                </Button>
                <Button type="submit" disabled={history.isLoading || !material}>
                  保存
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
