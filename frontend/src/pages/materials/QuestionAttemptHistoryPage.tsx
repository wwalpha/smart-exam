import { useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuestionAttemptHistory } from '@/hooks/materials';
import { useReviewCandidateForTarget } from '@/hooks/review';
import { useWordTestStore } from '@/stores';
import { compareQuestionNumber } from '@/utils/questionNumber';
import { REVIEW_MODE } from '@smart-exam/api-types';

export const QuestionAttemptHistoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialQuestionId = searchParams.get('questionId');

  const { detail: material, questions, status } = useWordTestStore((s) => s.material);
  const fetchMaterial = useWordTestStore((s) => s.fetchMaterial);
  const fetchQuestions = useWordTestStore((s) => s.fetchQuestions);

  useEffect(() => {
    if (!id) return;
    void fetchMaterial(id);
    void fetchQuestions(id);
  }, [id, fetchMaterial, fetchQuestions]);

  const sorted = useMemo(() => {
    return [...questions].sort((a, b) => compareQuestionNumber(a.canonicalKey, b.canonicalKey));
  }, [questions]);

  const history = useQuestionAttemptHistory({
    subject: material?.subject ?? null,
    questions: sorted,
  });

  useEffect(() => {
    if (!initialQuestionId) return;
    if (!history.isOpen) {
      void history.openForQuestion(initialQuestionId);
    }
  }, [initialQuestionId, history]);

  const candidateState = useReviewCandidateForTarget({
    mode: REVIEW_MODE.QUESTION,
    targetId: history.selectedQuestion?.id ?? null,
    subject: material?.subject ?? null,
    enabled: history.isOpen,
  });

  if (status.isLoading && !material) {
    return <div className="p-8">Loading...</div>;
  }

  if (!id) {
    return <div className="p-8">IDが不正です。</div>;
  }

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">問題テスト履歴</h1>
          <div className="text-sm text-muted-foreground">{material?.name ?? id}</div>
        </div>
        <Button asChild variant="outline">
          <Link to={`/materials/${id}/questions`}>戻る</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>問題一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">問題番号</TableHead>
                <TableHead />
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>{q.canonicalKey}</TableCell>
                  <TableCell className="text-muted-foreground">{q.id}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => void history.openForQuestion(q.id)}>
                      履歴
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    問題がありません
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={history.isOpen}
        onOpenChange={(open) => {
          if (!open) history.close();
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>履歴: {history.selectedQuestion?.canonicalKey ?? ''}</DialogTitle>
          </DialogHeader>

          {history.error ? <div className="text-sm text-destructive">{history.error}</div> : null}
          {candidateState.error ? <div className="text-sm text-destructive">{candidateState.error}</div> : null}

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                次回日付: <span className="font-medium">{candidateState.candidate?.nextTime ?? '-'}</span>
              </div>
              <div>
                ロック: <span className="font-medium">{candidateState.candidate?.testId ?? '-'}</span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">実施日</TableHead>
                  <TableHead className="w-[100px]">正誤</TableHead>
                  <TableHead>復習テストID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.attempts.map((a) => (
                  <TableRow key={`${a.reviewTestId ?? ''}#${a.dateYmd}`}>
                    <TableCell>{a.dateYmd}</TableCell>
                    <TableCell>{a.isCorrect ? '正解' : '不正解'}</TableCell>
                    <TableCell className="text-muted-foreground">{a.reviewTestId ?? '-'}</TableCell>
                  </TableRow>
                ))}
                {history.attempts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                      履歴がありません
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={history.close}>
                閉じる
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
