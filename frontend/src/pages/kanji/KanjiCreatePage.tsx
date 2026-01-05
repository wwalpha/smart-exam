import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useKanjiCreate } from '@/hooks/kanji';
import { useReviewAttemptHistory } from '@/hooks/review';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

export const KanjiCreatePage = () => {
  const { isEdit, kanjiId, detail, form, submit, isSubmitting } = useKanjiCreate();
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const subject = watch('subject');

  const history = useReviewAttemptHistory({
    targetType: 'KANJI',
    targetId: isEdit ? kanjiId : null,
    subject: detail?.subject ?? null,
    enabled: isEdit,
  });
  const {
    register: registerHistory,
    formState: { errors: historyErrors },
  } = history.form;

  return (
    <div className="space-y-6 p-8 max-w-2xl mx-auto">
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2 pt-4">
              <Label>科目</Label>
              <input type="hidden" {...register('subject', { required: '必須です' })} />
              <Select
                value={subject}
                onValueChange={(v) =>
                  setValue('subject', v as WordTestSubject, { shouldDirty: true, shouldValidate: true })
                }>
                <SelectTrigger
                  aria-invalid={!!errors.subject}
                  className={errors.subject ? 'border-destructive focus:ring-destructive' : undefined}>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SUBJECT.japanese}>{SUBJECT_LABEL[SUBJECT.japanese]}</SelectItem>
                  <SelectItem value={SUBJECT.society}>{SUBJECT_LABEL[SUBJECT.society]}</SelectItem>
                </SelectContent>
              </Select>
              {errors.subject?.message ? (
                <p className="text-sm text-destructive">{String(errors.subject.message)}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>問題 *</Label>
              <Input
                {...register('kanji', { required: '必須です' })}
                aria-invalid={!!errors.kanji}
                className={errors.kanji ? 'border-destructive focus-visible:ring-destructive' : undefined}
                placeholder="例: 憂鬱"
              />
              {errors.kanji?.message ? (
                <p className="text-sm text-destructive">{String(errors.kanji.message)}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>答え *</Label>
              <Input
                {...register('reading', { required: '必須です' })}
                aria-invalid={!!errors.reading}
                className={errors.reading ? 'border-destructive focus-visible:ring-destructive' : undefined}
                placeholder="例: ゆううつ"
              />
              {errors.reading?.message ? (
                <p className="text-sm text-destructive">{String(errors.reading.message)}</p>
              ) : null}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '登録中...' : '登録する'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isEdit ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">テスト履歴</div>
                <div className="text-xs text-muted-foreground">実施日単位で正誤を登録します</div>
              </div>
              <Button type="button" variant="outline" onClick={history.startAdd} disabled={history.isLoading}>
                追加
              </Button>
            </div>

            {history.error ? <div className="mt-3 text-sm text-destructive">{history.error}</div> : null}

            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">実施日</TableHead>
                    <TableHead className="w-[100px]">正誤</TableHead>
                    <TableHead>メモ</TableHead>
                    <TableHead className="w-[96px]" />
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
                        <Button type="button" variant="outline" size="sm" onClick={() => history.startEdit(a)}>
                          編集
                        </Button>
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
            </div>

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
                      className={
                        historyErrors.dateYmd ? 'border-destructive focus-visible:ring-destructive' : undefined
                      }
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
                    <Button type="submit" disabled={history.isLoading}>
                      保存
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
