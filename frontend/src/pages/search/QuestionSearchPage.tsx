import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useQuestionSearch } from '@/hooks/search';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

export const QuestionSearchPage = () => {
  const { results, isSearching, form, submit } = useQuestionSearch();
  const { register, setValue } = form;

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">問題検索</h1>

      <Card>
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-wrap gap-4 items-end">
            <div className="w-64 space-y-2">
              <Label>キーワード</Label>
              <Input {...register('keyword')} placeholder="問題文を検索..." />
            </div>
            <div className="w-40 space-y-2">
              <Label>科目</Label>
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
            <Button type="submit" disabled={isSearching}>
              {isSearching ? '検索中...' : '検索'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>科目</TableHead>
              <TableHead>単元</TableHead>
              <TableHead className="w-1/2">問題文</TableHead>
              <TableHead>出典</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  検索結果はありません
                </TableCell>
              </TableRow>
            ) : (
              results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {SUBJECT_LABEL[result.subject as keyof typeof SUBJECT_LABEL] ?? ''}
                    </Badge>
                  </TableCell>
                  <TableCell>{result.unit}</TableCell>
                  <TableCell>{result.questionText}</TableCell>
                  <TableCell>{result.sourceMaterialName}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
