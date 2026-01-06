import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useReviewAttemptHistoryDialog, useReviewTargets, useReviewCandidateForTarget } from '@/hooks/review';
import { SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

export const QuestionAttemptHistoryListPage = () => {
  const { items, isLoading, error, form, submit } = useReviewTargets({ mode: 'QUESTION' });
  const {
    register,
    formState: { errors },
  } = form;

  const targets = useMemo(() => {
    return items.filter((x) => x.targetType === 'QUESTION');
  }, [items]);

  const dialog = useReviewAttemptHistoryDialog();

  const candidateState = useReviewCandidateForTarget({
    mode: 'QUESTION',
    targetId: dialog.selected?.targetId ?? null,
    subject: dialog.selected?.subject ?? null,
    enabled: dialog.isOpen,
  });

  return (
    <div className="space-y-6 px-8 py-4">
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>開始日 *</Label>
                <Input
                  type="date"
                  {...register('from', { required: '必須です' })}
                  aria-invalid={!!errors.from}
                  className={errors.from ? 'border-destructive focus-visible:ring-destructive' : undefined}
                />
                {errors.from?.message ? (
                  <p className="text-sm text-destructive">{String(errors.from.message)}</p>
                ) : null}
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
                      void dialog.open({ targetId: t.targetId, subject: t.subject as any, title });
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
        open={dialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            dialog.close();
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>履歴: {dialog.selected?.title ?? ''}</DialogTitle>
          </DialogHeader>

          {dialog.error ? <div className="text-sm text-destructive">{dialog.error}</div> : null}
          {candidateState.error ? <div className="text-sm text-destructive">{candidateState.error}</div> : null}

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                次回日付: <span className="font-medium">{candidateState.candidate?.nextTime ?? '-'}</span>
              </div>
              <div>
                ロック: <span className="font-medium">{candidateState.candidate?.testId ?? '-'}</span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">実施日</TableHead>
                  <TableHead className="w-[100px]">正誤</TableHead>
                  <TableHead>復習テストID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dialog.attempts.map((a) => (
                  <TableRow key={`${a.reviewTestId ?? ''}#${a.dateYmd}`}>
                    <TableCell>{a.dateYmd}</TableCell>
                    <TableCell>{a.isCorrect ? '正解' : '不正解'}</TableCell>
                    <TableCell className="text-muted-foreground">{a.reviewTestId ?? '-'}</TableCell>
                  </TableRow>
                ))}
                {dialog.attempts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                      履歴がありません
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={dialog.close}>
                閉じる
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
