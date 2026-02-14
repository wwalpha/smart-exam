import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReviewQuestionList } from '@/hooks/review';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import { formatYmdSlash } from '@/utils/date';
import type { WordTestSubject } from '@typings/wordtest';
import { FileText, Trash2 } from 'lucide-react';

export const ReviewTestQuestionListPage = () => {
  const { basePath, reviews, form, search, remove, ConfirmDialog } = useReviewQuestionList();
  const { setValue } = form;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default">完了</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="secondary">実施中</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 px-8 py-4 ">
      <ConfirmDialog />
      <Card>
        <CardContent className="p-6 pt-4">
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
                    <SelectItem value={SUBJECT.math}>{SUBJECT_LABEL[SUBJECT.math]}</SelectItem>
                    <SelectItem value={SUBJECT.science}>{SUBJECT_LABEL[SUBJECT.science]}</SelectItem>
                    <SelectItem value={SUBJECT.society}>{SUBJECT_LABEL[SUBJECT.society]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <label className="text-sm font-medium">ステータス</label>
                <Select
                  onValueChange={(v) => setValue('status', v as 'ALL' | 'IN_PROGRESS' | 'COMPLETED')}
                  defaultValue="ALL">
                  <SelectTrigger>
                    <SelectValue placeholder="ステータス" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全て</SelectItem>
                    <SelectItem value="IN_PROGRESS">実施中</SelectItem>
                    <SelectItem value="COMPLETED">完了</SelectItem>
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
              <TableHead>作成日時</TableHead>
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
                  <Badge variant="outline">{SUBJECT_LABEL[test.subject as keyof typeof SUBJECT_LABEL] ?? ''}</Badge>
                </TableCell>
                <TableCell>
                  <Link to={`${basePath}/${test.id}`} className="font-medium hover:underline">
                    {formatYmdSlash(test.createdDate)}
                  </Link>
                </TableCell>
                <TableCell>{test.count}問</TableCell>
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
