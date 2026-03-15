import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCandidateSearch } from '@/hooks/candidate';
import { CANDIDATE_MODE_LABEL, SEARCH_SUBJECT_OPTION, SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';

export const CandidateSearchPage = () => {
  const {
    results,
    selectedSubject,
    selectedKanjiSubject,
    isKanjiSelected,
    currentPage,
    totalPages,
    hasResults,
    goToPreviousPage,
    goToNextPage,
    handleSubjectChange,
    handleKanjiSubjectChange,
    isSearching,
    form,
    submit,
  } = useCandidateSearch();
  const { register } = form;

  return (
    <div className="space-y-6 p-8">
      <Card>
        <CardContent>
          <form onSubmit={submit} className="flex flex-wrap gap-4 items-end">
            <div className="w-40 space-y-2">
              <Label>科目</Label>
              <Select
                value={selectedSubject}
                onValueChange={handleSubjectChange}
                defaultValue={SEARCH_SUBJECT_OPTION.all}
              >
                <SelectTrigger>
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
                  value={selectedKanjiSubject}
                  onValueChange={handleKanjiSubjectChange}
                  defaultValue={SUBJECT.japanese}
                >
                  <SelectTrigger>
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

      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage <= 1}>
            前へ
          </Button>
          <div className="text-sm">
            {currentPage} / {totalPages}
          </div>
          <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage >= totalPages}>
            次へ
          </Button>
        </div>
      </div>

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
            {!hasResults ? (
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
