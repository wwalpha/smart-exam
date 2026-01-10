import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useKanjiList } from '@/hooks/kanji';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

export const KanjiListPage = () => {
  const { kanjiList, total, form, runSearch, remove, removeMany, ConfirmDialog } = useKanjiList();
  const { register, setValue, watch, handleSubmit } = form;
  const subject = watch('subject');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const totalPages = Math.max(1, Math.ceil(kanjiList.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pagedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return kanjiList.slice(start, start + pageSize);
  }, [kanjiList, currentPage, pageSize]);

  const onSearch = handleSubmit((data) => {
    setPage(1);
    setSelectedIds(new Set());
    runSearch(data);
  });

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      // 一覧が空のときは選択状態を必ず空にする
      if (kanjiList.length === 0) return new Set();
      // すでに全件選択なら「解除」として扱う
      if (prev.size === kanjiList.length) return new Set();
      return new Set(kanjiList.map((k) => k.id));
    });
  };

  const toggleSelectPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const pageIds = pagedList.map((k) => k.id);
      // 「このページの全件が選択済み」かどうかで、解除/追加を切り替える
      const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => next.has(id));
      if (allOnPageSelected) {
        for (const id of pageIds) next.delete(id);
        return next;
      }
      for (const id of pageIds) next.add(id);
      return next;
    });
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    // 選択がない場合は確認ダイアログを出さない
    if (ids.length === 0) return;
    await removeMany(ids);
    setSelectedIds(new Set());
    setPage(1);
  };

  return (
    <div className="space-y-6 p-8">
      <ConfirmDialog />
      <Card>
        <CardHeader>
          <CardTitle className="sr-only">検索</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="kanji-search-form" onSubmit={onSearch} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
              <div>
                <input type="hidden" {...register('subject')} />
                <Select
                  value={subject}
                  onValueChange={(v) => setValue('subject', v as 'ALL' | WordTestSubject, { shouldDirty: true })}>
                  <SelectTrigger>
                    <SelectValue placeholder="科目" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全て</SelectItem>
                    <SelectItem value={SUBJECT.japanese}>{SUBJECT_LABEL[SUBJECT.japanese]}</SelectItem>
                    <SelectItem value={SUBJECT.society}>{SUBJECT_LABEL[SUBJECT.society]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input {...register('q')} placeholder="問題" />
              </div>
              <div>
                <Input {...register('reading')} placeholder="解答" />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button asChild variant="outline">
                <Link to="/kanji/import">一括インポート</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/kanji/new">新規登録</Link>
              </Button>
              <Button type="submit">検索</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">全{total}件</div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={toggleSelectAll} disabled={kanjiList.length === 0}>
            一括選択
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={bulkDelete}
            disabled={selectedIds.size === 0}>
            一括削除
          </Button>

          <div className="w-28">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                const n = Number(v);
                setPage(1);
                setPageSize(Number.isFinite(n) && n > 0 ? n : 10);
                setSelectedIds(new Set());
              }}>
              <SelectTrigger>
                <SelectValue placeholder="件数" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10件</SelectItem>
                <SelectItem value="50">50件</SelectItem>
                <SelectItem value="100">100件</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

      <div className="w-full rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 px-2">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={pagedList.length > 0 && pagedList.every((k) => selectedIds.has(k.id))}
                    onCheckedChange={() => toggleSelectPage()}
                    aria-label="ページ内を一括選択"
                  />
                </div>
              </TableHead>
              <TableHead className="w-24">
                <span className="sr-only">操作</span>
              </TableHead>
              <TableHead className="w-24 text-center">科目</TableHead>
              <TableHead className="w-[45%] px-2">問題</TableHead>
              <TableHead className="w-[35%] px-2">解答</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedList.map((kanji) => (
              <TableRow key={kanji.id}>
                <TableCell className="w-12 px-2 py-2">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={selectedIds.has(kanji.id)}
                      onCheckedChange={(checked) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(kanji.id);
                          else next.delete(kanji.id);
                          return next;
                        });
                      }}
                      aria-label="選択"
                    />
                  </div>
                </TableCell>
                <TableCell className="px-2 py-2">
                  <div className="flex gap-2">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8" aria-label="編集">
                      <Link to={`/kanji/${kanji.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="削除"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => remove(kanji.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="px-2 py-2 text-sm text-center">
                  <div
                    className="truncate text-center"
                    title={SUBJECT_LABEL[kanji.subject as keyof typeof SUBJECT_LABEL] ?? ''}>
                    {SUBJECT_LABEL[kanji.subject as keyof typeof SUBJECT_LABEL] ?? ''}
                  </div>
                </TableCell>
                <TableCell className="px-2 py-2 text-sm font-medium">
                  <div className="truncate" title={kanji.kanji}>
                    {kanji.kanji}
                  </div>
                </TableCell>
                <TableCell className="px-2 py-2 text-sm">
                  <div className="truncate" title={kanji.reading}>
                    {kanji.reading}
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
    </div>
  );
};
