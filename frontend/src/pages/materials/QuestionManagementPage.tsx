import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useQuestionManagement } from '@/hooks/materials';

export const QuestionManagementPage = () => {
  const {
    id,
    material,
    questions,
    isInitialLoading,
    isBusy,
    busyQuestionId,
    error,
    isDialogOpen,
    setIsDialogOpen,
    isBulkDialogOpen,
    setIsBulkDialogOpen,
    bulkInput,
    setBulkInput,
    form,
    submit,
    submitBulk,
    remove,
    markCorrect,
    markIncorrect,
    ConfirmDialog,
  } = useQuestionManagement();
  const {
    register,
    formState: { errors },
  } = form;

  if (isInitialLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">問題管理</h1>
          <p className="text-muted-foreground">
            {material?.name}
            {material?.materialDate ? ` / ${material.materialDate}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/materials/${id}`}>詳細へ戻る</Link>
          </Button>
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isBusy} variant="outline">
                一括追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>問題追加（一括）</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label>問題番号 *</Label>
                <Textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  disabled={isBusy}
                  placeholder={'例:\n1-1\n1-2\n2-1'}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">改行/スペース/カンマ区切りで複数入力できます</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsBulkDialogOpen(false)} disabled={isBusy}>
                  キャンセル
                </Button>
                <Button type="button" onClick={submitBulk} disabled={isBusy}>
                  追加
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isBusy}>手動追加</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>問題追加</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>問題番号 *</Label>
                  <Input
                    {...register('canonicalKey', {
                      required: '必須です',
                      pattern: {
                        value: /^\d+(?:-\d+)*(?:-[A-Za-z])?$/,
                        message: 'ハイフン区切りで入力してください (例: 1-1 / 1-8-A)',
                      },
                    })}
                    aria-invalid={!!errors.canonicalKey}
                    className={errors.canonicalKey ? 'border-destructive focus-visible:ring-destructive' : undefined}
                    placeholder="例: 1-1"
                  />
                  {errors.canonicalKey?.message ? (
                    <p className="text-sm text-destructive">{String(errors.canonicalKey.message)}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">階層はハイフン区切り (例: 1-1-1 / 1-8-A)</p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isBusy}>
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={isBusy}>
                    追加
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="w-full max-w-5xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>問題番号</TableHead>
                <TableHead>状態</TableHead>
                <TableHead className="w-[176px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id} className="h-10">
                  <TableCell className="py-2">{q.canonicalKey}</TableCell>
                  <TableCell className="py-2">
                    {q.reviewCandidate ? (
                      <div className="flex items-center gap-2">
                        {q.reviewCandidate.status === 'OPEN' ? (
                          <Badge variant="outline">不正解</Badge>
                        ) : q.reviewCandidate.status === 'EXCLUDED' ||
                          (q.reviewCandidate.status === 'CLOSED' && q.reviewCandidate.correctCount > 0) ? (
                          <Badge variant="secondary">正解</Badge>
                        ) : (
                          <Badge variant="secondary">履歴</Badge>
                        )}
                        {q.reviewCandidate.status === 'OPEN' ? (
                          <span className="text-sm text-muted-foreground">次回: {q.reviewCandidate.nextTime}</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">未設定</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex justify-end">
                      {(() => {
                        const isRowBusy = busyQuestionId === q.id;

                        const value = (() => {
                          if (!q.reviewCandidate) return '';
                          if (q.reviewCandidate.status === 'OPEN') return 'incorrect';
                          if (q.reviewCandidate.status === 'EXCLUDED') return 'correct';
                          if (q.reviewCandidate.status === 'CLOSED' && q.reviewCandidate.correctCount > 0)
                            return 'correct';
                          return '';
                        })();

                        return (
                          <div className="flex items-center gap-3">
                            <RadioGroup
                              value={value}
                              disabled={isRowBusy}
                              onValueChange={(v) => {
                                if (v === value) return;
                                if (v === 'correct') return markCorrect(q.id);
                                if (v === 'incorrect') return markIncorrect(q.id);
                              }}
                              className="flex min-w-[220px] items-center gap-4">
                              <div
                                className="flex items-center gap-2 whitespace-nowrap"
                                onClick={() => {
                                  if (isRowBusy) return;
                                  if (value === 'incorrect') return;
                                  markIncorrect(q.id);
                                }}>
                                <RadioGroupItem value="incorrect" id={`incorrect-${q.id}`} />
                                <Label className="whitespace-nowrap" htmlFor={`incorrect-${q.id}`}>
                                  不正解
                                </Label>
                              </div>
                              <div
                                className="flex items-center gap-2 whitespace-nowrap"
                                onClick={() => {
                                  if (isRowBusy) return;
                                  if (value === 'correct') return;
                                  markCorrect(q.id);
                                }}>
                                <RadioGroupItem value="correct" id={`correct-${q.id}`} />
                                <Label className="whitespace-nowrap" htmlFor={`correct-${q.id}`}>
                                  正解
                                </Label>
                              </div>
                            </RadioGroup>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={isRowBusy}
                              onClick={() => remove(q.id)}>
                              削除
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    問題が登録されていません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
