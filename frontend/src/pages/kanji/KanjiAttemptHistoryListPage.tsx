import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useReviewTargets } from '@/hooks/review';
import { SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

export const KanjiAttemptHistoryListPage = () => {
  const { items, isLoading, error, form, submit } = useReviewTargets({ mode: 'KANJI' });
  const {
    register,
    formState: { errors },
  } = form;

  const targets = useMemo(() => {
    return items.filter((x) => x.targetType === 'KANJI');
  }, [items]);

  return (
    <div className="space-y-6 px-6">
      <Card>
        <CardHeader>
          <CardTitle>対象期間</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
            <div className="space-y-2">
              <Label>開始日 *</Label>
              <Input
                type="date"
                {...register('from', { required: '必須です' })}
                aria-invalid={!!errors.from}
                className={errors.from ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.from?.message ? <p className="text-sm text-destructive">{String(errors.from.message)}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>終了日 *</Label>
              <Input
                type="date"
                {...register('to', { required: '必須です' })}
                aria-invalid={!!errors.to}
                className={errors.to ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.to?.message ? <p className="text-sm text-destructive">{String(errors.to.message)}</p> : null}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                表示
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">全{targets.length}件</div>

      {error ? <div className="text-sm text-destructive">{error}</div> : null}

      <div className="w-full rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[96px]">操作</TableHead>
              <TableHead className="w-24">科目</TableHead>
              <TableHead className="w-[30%]">漢字</TableHead>
              <TableHead className="w-[30%]">よみ</TableHead>
              <TableHead className="w-28">最終出題日</TableHead>
              <TableHead className="w-20 text-right">回数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {targets.map((t) => (
              <TableRow key={`${t.subject}#${t.targetId}`}>
                <TableCell className="px-2 py-1">
                  <Button asChild variant="outline" size="sm" className="h-8">
                    <Link to={`/kanji/${t.targetId}/attempts`}>履歴</Link>
                  </Button>
                </TableCell>
                <TableCell className="px-2 py-1 text-sm">
                  <div className="truncate" title={SUBJECT_LABEL[t.subject as WordTestSubject] ?? ''}>
                    {SUBJECT_LABEL[t.subject as WordTestSubject] ?? ''}
                  </div>
                </TableCell>
                <TableCell className="px-2 py-1 text-sm font-medium">
                  <div className="truncate" title={t.kanji ?? ''}>
                    {t.kanji ?? ''}
                  </div>
                </TableCell>
                <TableCell className="px-2 py-1 text-sm">
                  <div className="truncate" title={t.reading ?? ''}>
                    {t.reading ?? ''}
                  </div>
                </TableCell>
                <TableCell className="px-2 py-1 text-sm">{t.lastTestCreatedDate}</TableCell>
                <TableCell className="px-2 py-1 text-sm text-right">{t.includedCount}</TableCell>
              </TableRow>
            ))}
            {targets.length === 0 && (
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
