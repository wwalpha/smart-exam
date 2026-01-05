import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReviewList } from '@/hooks/review';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';
import { FileText, Trash2 } from 'lucide-react';

export const ReviewTestListPage = () => {
  const { isKanji, basePath, reviews, form, search, remove, ConfirmDialog } = useReviewList();
  const { setValue } = form;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default">完了</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="secondary">実施中</Badge>;
      case 'PAUSED':
        return <Badge variant="outline">中断</Badge>;
      case 'CANCELED':
        return <Badge variant="destructive">中止</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-8">
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">復習テスト一覧</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={search} className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-40">
                <label className="text-sm font-medium">科目</label>
                <Select onValueChange={(v) => setValue('subject', v as 'ALL' | WordTestSubject)} defaultValue="ALL">
                  <SelectTrigger>
                    <SelectValue placeholder="科目" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全て</SelectItem>
                    {isKanji ? (
                      <>
                        <SelectItem value={SUBJECT.japanese}>{SUBJECT_LABEL[SUBJECT.japanese]}</SelectItem>
                        <SelectItem value={SUBJECT.society}>{SUBJECT_LABEL[SUBJECT.society]}</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value={SUBJECT.math}>{SUBJECT_LABEL[SUBJECT.math]}</SelectItem>
                        <SelectItem value={SUBJECT.science}>{SUBJECT_LABEL[SUBJECT.science]}</SelectItem>
                        <SelectItem value={SUBJECT.society}>{SUBJECT_LABEL[SUBJECT.society]}</SelectItem>
                      </>
                    )}
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
            </div>

            <div className="flex w-full justify-end gap-2">
              <Button asChild variant="outline">
                <Link to={`${basePath}/new`}>新規作成</Link>
              </Button>
              <Button type="submit">検索</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24" />
              <TableHead>科目</TableHead>
              <TableHead>作成日</TableHead>
              <TableHead>問題数</TableHead>
              <TableHead>ステータス</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((test) => (
              <TableRow key={test.id}>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="ghost" size="icon" aria-label="詳細">
                      <Link to={`${basePath}/${test.id}`}>
                        <FileText className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="削除"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => remove(test.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {SUBJECT_LABEL[test.subject as keyof typeof SUBJECT_LABEL] ?? ''}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link to={`${basePath}/${test.id}`} className="font-medium hover:underline">
                    {test.createdDate}
                  </Link>
                </TableCell>
                <TableCell>{test.itemCount}問</TableCell>
                <TableCell>{getStatusBadge(test.status)}</TableCell>
              </TableRow>
            ))}
            {reviews.length === 0 && (
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
