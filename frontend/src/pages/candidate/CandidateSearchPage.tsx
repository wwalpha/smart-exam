import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCandidateSearch } from '@/hooks/candidate';
import { EXAM_MODE } from '@smart-exam/api-types';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

const SEARCH_SUBJECT_OPTION = {
  all: 'ALL',
  kanji: 'KANJI',
} as const;

const CANDIDATE_MODE_LABEL = {
  [EXAM_MODE.MATERIAL]: '問題',
  [EXAM_MODE.KANJI]: '漢字',
} as const;

export const CandidateSearchPage = () => {
  const { results, isSearching, form, submit } = useCandidateSearch();
  const { register, setValue, watch } = form;
  const subject = watch('subject');
  const isKanjiSelected = subject === SEARCH_SUBJECT_OPTION.kanji;

  return (
    <div className="space-y-6 p-8">
      <Card>
        <CardContent>
          <form onSubmit={submit} className="flex flex-wrap gap-4 items-end">
            <div className="w-40 space-y-2">
              <Label>科目</Label>
              <Select
                value={subject}
                onValueChange={(v) => setValue('subject', v as 'ALL' | WordTestSubject | 'KANJI')}
                defaultValue="ALL"
              >
                <SelectTrigger className="m-0">
                  <SelectValue placeholder="科目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全て</SelectItem>
                  <SelectItem value={SUBJECT.math}>{SUBJECT_LABEL[SUBJECT.math]}</SelectItem>
                  <SelectItem value={SUBJECT.science}>{SUBJECT_LABEL[SUBJECT.science]}</SelectItem>
                  <SelectItem value={SUBJECT.society}>{SUBJECT_LABEL[SUBJECT.society]}</SelectItem>
                  <SelectItem value={SEARCH_SUBJECT_OPTION.kanji}>漢字</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isKanjiSelected ? (
              <div className="w-40 space-y-2">
                <Label>漢字科目</Label>
                <Select
                  onValueChange={(v) => setValue('kanjiSubject', v as typeof SUBJECT.japanese | typeof SUBJECT.society)}
                  defaultValue={SUBJECT.japanese}
                >
                  <SelectTrigger className="m-0">
                    <SelectValue placeholder="漢字科目" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SUBJECT.japanese}>{SUBJECT_LABEL[SUBJECT.japanese]}</SelectItem>
                    <SelectItem value={SUBJECT.society}>{SUBJECT_LABEL[SUBJECT.society]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="w-44 space-y-2">
              <Label>次回日付</Label>
              <Input type="date" {...register('nextTime')} />
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
              <TableHead>次回日付</TableHead>
              <TableHead>種別</TableHead>
              <TableHead className="w-1/2">問題</TableHead>
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
                    <Badge variant="outline">{SUBJECT_LABEL[result.subject as keyof typeof SUBJECT_LABEL] ?? ''}</Badge>
                  </TableCell>
                  <TableCell>{result.nextTime}</TableCell>
                  <TableCell>{CANDIDATE_MODE_LABEL[result.mode]}</TableCell>
                  <TableCell>{result.questionText}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
