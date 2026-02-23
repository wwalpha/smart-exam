import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge, getSubjectBadgeVariant } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useQuestionManagement } from '@/hooks/materials';
import { SUBJECT_LABEL } from '@/lib/Consts';

export const QuestionManagementPage = () => {
  const {
    id,
    material,
    questions,
    isInitialLoading,
    isBusy,
    busyQuestionId,
    error,
    isBulkDialogOpen,
    setIsBulkDialogOpen,
    bulkInput,
    setBulkInput,
    optimisticResultByQuestionId,
    submitBulk,
    remove,
    markCorrect,
    markIncorrect,
    analyze,
    canAnalyze,
    ConfirmDialog,
  } = useQuestionManagement();

  if (isInitialLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">教材問題管理</h1>
          <p className="text-muted-foreground">
            {material?.name}
            {material?.materialDate ? ` / ${material.materialDate}` : ''}
          </p>
          {material?.subject ? (
            <div className="mt-2">
              <Badge variant={getSubjectBadgeVariant(material.subject)} className="px-3 py-1 text-sm font-semibold">
                {SUBJECT_LABEL[material.subject as keyof typeof SUBJECT_LABEL]}
              </Badge>
            </div>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/materials/${id}`}>詳細へ戻る</Link>
          </Button>
          <Button type="button" disabled={!canAnalyze} onClick={() => void analyze()}>
            番号分析
          </Button>
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isBusy || !!material?.isCompleted} variant="outline">
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
                  disabled={isBusy || !!material?.isCompleted}
                  placeholder={'例:\n1-1\n1-2\n2-1'}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">改行/スペース/カンマ区切りで複数入力できます</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBulkDialogOpen(false)}
                  disabled={isBusy || !!material?.isCompleted}>
                  キャンセル
                </Button>
                <Button type="button" onClick={submitBulk} disabled={isBusy || !!material?.isCompleted}>
                  追加
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="w-full">
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
                    {(() => {
                      const optimistic = optimisticResultByQuestionId[q.id];
                      if (optimistic === 'correct') {
                        return (
                          <div className="flex items-center gap-2">
                            <Badge variant="success_soft" className="px-3 py-1 text-sm font-semibold">
                              正解
                            </Badge>
                          </div>
                        );
                      }
                      if (optimistic === 'incorrect') {
                        return (
                          <div className="flex items-center gap-2">
                            <Badge variant="danger_soft" className="px-3 py-1 text-sm font-semibold">
                              不正解
                            </Badge>
                          </div>
                        );
                      }

                      if (q.choice === 'CORRECT') {
                        return (
                          <Badge variant="success_soft" className="px-3 py-1 text-sm font-semibold">
                            正解
                          </Badge>
                        );
                      }
                      if (q.choice === 'INCORRECT') {
                        return (
                          <Badge variant="danger_soft" className="px-3 py-1 text-sm font-semibold">
                            不正解
                          </Badge>
                        );
                      }
                      return <span className="text-sm text-muted-foreground">未設定</span>;
                    })()}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex justify-end">
                      {(() => {
                        const isRowBusy = busyQuestionId === q.id;
                        const optimistic = optimisticResultByQuestionId[q.id];

                        const value = (() => {
                          if (optimistic) return optimistic;
                          if (q.choice === 'CORRECT') return 'correct';
                          if (q.choice === 'INCORRECT') return 'incorrect';
                          return '';
                        })();

                        return (
                          <div className="flex items-center gap-3">
                            <RadioGroup
                              value={value}
                              disabled={isRowBusy || !!material?.isCompleted}
                              onValueChange={(v) => {
                                if (v === value) return;
                                if (v === 'correct') return markCorrect(q.id);
                                if (v === 'incorrect') return markIncorrect(q.id);
                              }}
                              className="flex min-w-[220px] items-center gap-4">
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <RadioGroupItem value="correct" id={`correct-${q.id}`} />
                                <Label className="whitespace-nowrap" htmlFor={`correct-${q.id}`}>
                                  正解
                                </Label>
                              </div>
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <RadioGroupItem value="incorrect" id={`incorrect-${q.id}`} />
                                <Label className="whitespace-nowrap" htmlFor={`incorrect-${q.id}`}>
                                  不正解
                                </Label>
                              </div>
                            </RadioGroup>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={isRowBusy || !!material?.isCompleted}
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
