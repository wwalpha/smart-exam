import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMaterialList } from '@/hooks/materials';

export const MaterialSetListPage = () => {
  const { materials, form, search } = useMaterialList();
  const { register, setValue } = form;

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">教材セット一覧</h1>
        <Button asChild>
          <Link to="/materials/new">新規登録</Link>
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
                  <SelectItem value="理科">理科</SelectItem>
                  <SelectItem value="社会">社会</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <label className="text-sm font-medium">学年</label>
              <Select onValueChange={(v) => setValue('grade', v)} defaultValue="ALL">
                <SelectTrigger>
                  <SelectValue placeholder="学年" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全て</SelectItem>
                  <SelectItem value="4">4年</SelectItem>
                  <SelectItem value="5">5年</SelectItem>
                  <SelectItem value="6">6年</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium">キーワード</label>
              <Input {...register('q')} placeholder="教材名、回・テスト名など" />
            </div>
            <Button type="submit">検索</Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>教材名</TableHead>
              <TableHead>科目</TableHead>
              <TableHead>実施日</TableHead>
              <TableHead>回・テスト名</TableHead>
              <TableHead>学年</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material) => (
              <TableRow key={material.id}>
                <TableCell>
                  <Link to={`/materials/${material.id}`} className="font-medium hover:underline">
                    {material.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{material.subject}</Badge>
                </TableCell>
                <TableCell>{material.date}</TableCell>
                <TableCell>{material.testType}</TableCell>
                <TableCell>{material.grade}年</TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/materials/${material.id}`}>詳細</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {materials.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
