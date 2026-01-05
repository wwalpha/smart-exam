import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMaterialList } from '@/hooks/materials';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

export const MaterialSetListPage = () => {
  const { materials, form, search, remove, ConfirmDialog } = useMaterialList();
  const { register, setValue } = form;

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(materials.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pagedMaterials = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return materials.slice(start, start + pageSize);
  }, [materials, currentPage]);

  const onSearch: React.FormEventHandler<HTMLFormElement> = (e) => {
    setPage(1);
    search(e);
  };

  return (
    <div className="space-y-6 p-8">
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">教材セット</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSearch} className="flex flex-wrap gap-4 items-end">
            <div className="w-40">
              <label className="text-sm font-medium">科目</label>
              <Select onValueChange={(v) => setValue('subject', v as 'ALL' | WordTestSubject)} defaultValue="ALL">
                <SelectTrigger>
                  <SelectValue placeholder="科目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全て</SelectItem>
                  <SelectItem value={SUBJECT.math}>{SUBJECT_LABEL[SUBJECT.math]}</SelectItem>
                  <SelectItem value={SUBJECT.science}>{SUBJECT_LABEL[SUBJECT.science]}</SelectItem>
                  <SelectItem value={SUBJECT.society}>{SUBJECT_LABEL[SUBJECT.society]}</SelectItem>
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
              <Input {...register('q')} placeholder="教材名など" />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit">検索</Button>
              <Button type="button" asChild>
                <Link to="/materials/new">新規登録</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}>
            前へ
          </Button>
          <div className="text-sm">
            {currentPage} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}>
            次へ
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead>教材名</TableHead>
              <TableHead>科目</TableHead>
              <TableHead>実施年月日</TableHead>
              <TableHead>学年</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedMaterials.map((material) => (
              <TableRow key={material.id}>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="削除"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => remove(material.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell>
                  <Link to={`/materials/${material.id}`} className="font-medium underline underline-offset-4">
                    {material.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {SUBJECT_LABEL[material.subject as keyof typeof SUBJECT_LABEL] ?? ''}
                  </Badge>
                </TableCell>
                <TableCell>{material.yearMonth}</TableCell>
                <TableCell>{material.grade}年</TableCell>
              </TableRow>
            ))}
            {materials.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
