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
    isLoading,
    error,
    isDialogOpen,
    setIsDialogOpen,
    form,
    submit,
    remove,
    ConfirmDialog,
  } = useQuestionManagement();
  const { register } = form;

  if (isLoading) {
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
              <Button>手動追加</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>問題追加</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>表示番号 (displayLabel)</Label>
                  <Input {...register('displayLabel', { required: true })} placeholder="例: 1(1)" />
                </div>
                <div className="space-y-2">
                  <Label>正規化キー (canonicalKey)</Label>
                  <Input {...register('canonicalKey', { required: true })} placeholder="例: 1-1" />
                  <p className="text-xs text-muted-foreground">階層はハイフン区切り (例: 1-1-A)</p>
                </div>
                <div className="space-y-2">
                  <Label>分野 (任意)</Label>
                  <Input {...register('category')} placeholder="例: 計算問題" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit">追加</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>表示番号</TableHead>
                <TableHead>正規化キー</TableHead>
                <TableHead>分野</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>{q.displayLabel}</TableCell>
                  <TableCell>{q.canonicalKey}</TableCell>
                  <TableCell>{q.category || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="sm" onClick={() => remove(q.id)}>
                      削除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
