import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useReviewAttemptHistory, useReviewTargets } from '@/hooks/review';
import { SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';
import type { SubjectId } from '@smart-exam/api-types';

export const QuestionAttemptHistoryListPage = () => {
  const { items, isLoading, error, form, submit } = useReviewTargets({ mode: 'QUESTION' });
  const {
    register,
    formState: { errors },
  } = form;

  const targets = useMemo(() => {
    return items.filter((x) => x.targetType === 'QUESTION');
  }, [items]);

  const [selected, setSelected] = useState<{
    targetId: string;
    subject: SubjectId;
    title: string;
  } | null>(null);

  const history = useReviewAttemptHistory({
    targetType: 'QUESTION',
    targetId: selected?.targetId ?? null,
    subject: selected?.subject ?? null,
    enabled: true,
  });

  const {
    register: registerHistory,
    formState: { errors: historyErrors },
  } = history.form;

  return (
    <div className="space-y-6 px-8 py-4">
      <Card>
        <CardHeader>
          <CardTitle>対象期間</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
            <div className="space-y-2">
              <Label>開始日 *</Label>
              <Input
                type="date"
                {...register('from', { required: '必須です' })}
                aria-invalid={!!errors.from}
                className={errors.from ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.from?.message ? <p className="text-sm text-destructive">{String(errors.from.message)}</p> : null}
            </div>

            <div className="space-y-2">
              <Label>終了日 *</Label>
              <Input
                type="date"
                {...register('to', { required: '必須です' })}
                aria-invalid={!!errors.to}
                className={errors.to ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.to?.message ? <p className="text-sm text-destructive">{String(errors.to.message)}</p> : null}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                表示
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">全{targets.length}件</div>

      {error ? <div className="text-sm text-destructive">{error}</div> : null}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>科目</TableHead>
              <TableHead className="w-[96px]">履歴</TableHead>
              <TableHead className="w-[40%]">問題</TableHead>
              <TableHead>出典</TableHead>
              <TableHead className="w-28">最終出題日</TableHead>
              <TableHead className="w-20 text-right">回数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {targets.map((t) => (
              <TableRow key={`${t.subject}#${t.targetId}`}>
                <TableCell>{SUBJECT_LABEL[t.subject as WordTestSubject] ?? ''}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      const title = t.canonicalKey ?? t.questionText ?? t.displayLabel ?? t.targetId;
                      setSelected({ targetId: t.targetId, subject: t.subject as SubjectId, title });
                      history.startAdd();
                    }}>
                    履歴
                  </Button>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="truncate" title={t.canonicalKey ?? t.questionText ?? ''}>
                    {t.canonicalKey ?? t.questionText ?? ''}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="truncate" title={`${t.materialSetName ?? ''} ${t.materialSetDate ?? ''}`.trim()}>
                    {[t.materialSetName, t.materialSetDate].filter(Boolean).join(' ')}
                  </div>
                </TableCell>
                <TableCell>{t.lastTestCreatedDate}</TableCell>
                <TableCell className="text-right">{t.includedCount}</TableCell>
              </TableRow>
            ))}
            {targets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  データがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={history.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            history.setIsOpen(false);
            setSelected(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>履歴: {selected?.title ?? ''}</DialogTitle>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    history.setIsOpen(false);
                    setSelected(null);
                  }}>
                  閉じる
                </Button>
                <Button type="submit" disabled={history.isLoading || !selected}>
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
