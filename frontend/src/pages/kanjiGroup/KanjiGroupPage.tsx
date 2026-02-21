import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useKanjiGroupPage } from '@/hooks/kanjiGroup';
import { KanjiGroupCreateDialog } from './KanjiGroupCreateDialog';
import { SUBJECT_LABEL } from '@/lib/Consts';

export const KanjiGroupPage = () => {
  const { groups, status, isCreateDialogOpen, openCreateDialog, closeCreateDialog } = useKanjiGroupPage();

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">単語データ管理</h1>
          <p className="text-sm text-muted-foreground">テスト作成の元となる単語データを登録・管理します。</p>
        </div>
        <Button onClick={openCreateDialog}>新規登録</Button>
      </div>

      {status.error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{status.error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>登録済みデータ一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>タイトル</TableHead>
                <TableHead>科目</TableHead>
                <TableHead>登録日時</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                    登録されたデータはありません。
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.title}</TableCell>
                    <TableCell>{SUBJECT_LABEL[group.subject as keyof typeof SUBJECT_LABEL]}</TableCell>
                    <TableCell>{new Date(group.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <KanjiGroupCreateDialog open={isCreateDialogOpen} onClose={closeCreateDialog} />
    </div>
  );
}
