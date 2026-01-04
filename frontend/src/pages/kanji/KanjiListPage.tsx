import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useKanjiList } from '@/hooks/kanji';

export const KanjiListPage = () => {
  const { kanjiList, total, form, runSearch, remove, ConfirmDialog } = useKanjiList();
  const { register, setValue, watch, handleSubmit } = form;
  const subject = watch('subject');

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(kanjiList.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pagedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return kanjiList.slice(start, start + pageSize);
  }, [kanjiList, currentPage]);

  const onSearch = handleSubmit((data) => {
    setPage(1);
    runSearch(data);
  });

  return (
    <div className="space-y-6 p-8">
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">漢字マスタ一覧</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/kanji/import">一括インポート</Link>
          </Button>
          <Button asChild>
            <Link to="/kanji/new">新規登録</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSearch} className="flex flex-wrap gap-4 items-end">
            <div className="w-40">
              <label className="text-sm font-medium">問題</label>
              <Input {...register('q')} placeholder="問題" />
            </div>
            <div className="w-40">
              <label className="text-sm font-medium">答え</label>
              <Input {...register('reading')} placeholder="答え" />
            </div>
            <div className="w-40">
              <label className="text-sm font-medium">科目</label>
              <input type="hidden" {...register('subject')} />
              <Select value={subject} onValueChange={(v) => setValue('subject', v, { shouldDirty: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="科目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全て</SelectItem>
                  <SelectItem value="国語">国語</SelectItem>
                  <SelectItem value="社会">社会</SelectItem>
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
              <TableHead>問題</TableHead>
              <TableHead>答え</TableHead>
              <TableHead>意味</TableHead>
              <TableHead>科目</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedList.map((kanji) => (
              <TableRow key={kanji.id}>
                <TableCell className="font-medium text-lg">{kanji.kanji}</TableCell>
                <TableCell>{kanji.reading}</TableCell>
                <TableCell className="max-w-xs truncate">{kanji.meaning}</TableCell>
                <TableCell>{kanji.subject}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/kanji/${kanji.id}`}>編集</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => remove(kanji.id)}>
                      削除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {kanjiList.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  データがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">全{total}件</div>
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
    </div>
  );
};
