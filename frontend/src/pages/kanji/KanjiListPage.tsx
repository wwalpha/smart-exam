import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="sr-only">検索</CardTitle>
          <div className="flex gap-2">
            <Button type="submit" form="kanji-search-form">検索</Button>
            <Button asChild variant="outline">
              <Link to="/kanji/new">新規登録</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/kanji/import">一括インポート</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form id="kanji-search-form" onSubmit={onSearch} className="flex flex-wrap gap-4 items-end">
            <div className="w-40">
              <Input {...register('q')} placeholder="問題" />
            </div>
            <div className="w-40">
              <Input {...register('reading')} placeholder="解答" />
            </div>
            <div className="w-40">
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
          </form>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>操作</TableHead>
              <TableHead>問題</TableHead>
              <TableHead>解答</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedList.map((kanji) => (
              <TableRow key={kanji.id}>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="ghost" size="icon" aria-label="編集">
                      <Link to={`/kanji/${kanji.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="削除"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => remove(kanji.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-lg">{kanji.kanji}</div>
                  {kanji.subject ? <div className="text-xs text-muted-foreground">{kanji.subject}</div> : null}
                </TableCell>
                <TableCell>{kanji.reading}</TableCell>
              </TableRow>
            ))}
            {kanjiList.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
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
