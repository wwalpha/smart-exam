import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useQuestionManagement } from '@/hooks/materials';

export const QuestionManagementPage = () => {
  const {
    id,
    material,
    questions,
    isInitialLoading,
    isBusy,
    error,
    isDialogOpen,
    setIsDialogOpen,
    form,
    submit,
    remove,
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
          <p className="text-muted-foreground">{material?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/materials/${id}`}>詳細へ戻る</Link>
          </Button>
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
                        value: /^\d+(?:-\d+)*$/,
                        message: 'ハイフン区切りの数字で入力してください (例: 1-1)',
                      },
                    })}
                    aria-invalid={!!errors.canonicalKey}
                    className={errors.canonicalKey ? 'border-destructive focus-visible:ring-destructive' : undefined}
                    placeholder="例: 1-1"
                  />
                  {errors.canonicalKey?.message ? (
                    <p className="text-sm text-destructive">{String(errors.canonicalKey.message)}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">階層はハイフン区切り (例: 1-1-1)</p>
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

      <Card className="max-w-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>問題番号</TableHead>
                <TableHead className="w-[176px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id} className="h-10">
                  <TableCell className="py-2">{q.canonicalKey}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => remove(q.id)}>
                        削除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
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
