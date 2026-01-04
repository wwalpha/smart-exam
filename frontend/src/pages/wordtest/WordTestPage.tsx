import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WordTestCreateDialog } from '@/pages/wordtest/WordTestCreateDialog';
import { useWordTestPage } from '@/hooks/wordtest';
import { SUBJECT_LABEL } from '@/lib/Consts';

export const WordTestPage = () => {
  const { lists, error } = useWordTestPage();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">単語テスト</h1>
          <p className="text-sm text-muted-foreground">作成済みの単語テスト一覧です。</p>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>新規作成</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>テスト一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>テスト名</TableHead>
                <TableHead>科目</TableHead>
                <TableHead>作成日</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    テストがありません。
                  </TableCell>
                </TableRow>
              ) : (
                lists.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{SUBJECT_LABEL[item.subject as keyof typeof SUBJECT_LABEL]}</TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/wordtest/${item.id}`}>詳細</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/wordtest/${item.id}/grading`}>採点</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <WordTestCreateDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
