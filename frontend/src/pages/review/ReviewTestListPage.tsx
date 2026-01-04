import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReviewList } from '@/hooks/review';

export const ReviewTestListPage = () => {
  const {
    isKanji,
    basePath,
    reviews,
    form,
    search,
    remove,
    ConfirmDialog,
  } = useReviewList();
  const { setValue } = form;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge variant="default">完了</Badge>;
      case 'IN_PROGRESS': return <Badge variant="secondary">実施中</Badge>;
      case 'PAUSED': return <Badge variant="outline">中断</Badge>;
      case 'CANCELED': return <Badge variant="destructive">中止</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-8">
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isKanji ? '漢字復習テスト一覧' : '問題復習テスト一覧'}</h1>
        <Button asChild>
          <Link to={`${basePath}/new`}>新規生成</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={search} className="flex flex-wrap gap-4 items-end">
            <div className="w-40">
              <label className="text-sm font-medium">科目</label>
              <Select onValueChange={(v) => setValue('subject', v)} defaultValue="ALL">
                <SelectTrigger>
                  <SelectValue placeholder="科目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全て</SelectItem>
                  <SelectItem value="算数">算数</SelectItem>
                  <SelectItem value="国語">国語</SelectItem>
                  <SelectItem value="理科">理科</SelectItem>
                  <SelectItem value="社会">社会</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <label className="text-sm font-medium">ステータス</label>
              <Select onValueChange={(v) => setValue('status', v)} defaultValue="ALL">
                <SelectTrigger>
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全て</SelectItem>
                  <SelectItem value="IN_PROGRESS">実施中</SelectItem>
                  <SelectItem value="COMPLETED">完了</SelectItem>
                  <SelectItem value="PAUSED">中断</SelectItem>
                  <SelectItem value="CANCELED">中止</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">検索</Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>科目</TableHead>
              <TableHead>作成日</TableHead>
              <TableHead>問題数</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>スコア</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((test) => (
              <TableRow key={test.id}>
                <TableCell>
                  <Link to={`${basePath}/${test.id}`} className="font-medium hover:underline">
                    {test.testId}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{test.subject}</Badge>
                </TableCell>
                <TableCell>{new Date(test.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{test.itemCount}問</TableCell>
                <TableCell>{getStatusBadge(test.status)}</TableCell>
                <TableCell>{test.score !== undefined ? `${test.score}点` : '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`${basePath}/${test.id}`}>詳細</Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => remove(test.id)}>
                      削除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {reviews.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  データがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
