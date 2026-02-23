import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useReviewKanjiGrading } from '@/hooks/review';

export const ExamKanjiGradingPage = () => {
  const { review, isInitialLoading, isSaving, error, basePath, fields, watch, setValue, setAllCorrect, submit, id } =
    useReviewKanjiGrading();
  const isReadOnly = review?.status === 'COMPLETED';

  if (isInitialLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!review) return <div className="p-8">データの取得に失敗しました。</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">復習テスト採点</h1>
      </div>
      <Card>
        <CardContent>
          <form onSubmit={submit}>
            <div className="mb-4 flex items-center justify-end gap-2">
              <Button asChild variant="outline">
                <Link to={`${basePath}/${id}`}>戻る</Link>
              </Button>
              <Button type="button" variant="outline" onClick={setAllCorrect} disabled={isSaving || isReadOnly}>
                全問正解
              </Button>
              <Button type="submit" disabled={isSaving || isReadOnly}>
                保存
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => {
                const item = review.items[index];
                if (!item) return null;

                const isCorrect = watch(`items.${index}.isCorrect`) ?? true;
                const qaText = [item.questionText, item.answerText]
                  .filter((v) => (v ?? '').trim().length > 0)
                  .join(' / ');
                const value = isCorrect ? 'correct' : 'incorrect';

                return (
                  <div
                    key={field.id}
                    className="flex flex-nowrap items-center gap-3 overflow-x-auto rounded border px-3 py-2">
                    <Badge variant="outline" className="w-14 shrink-0 justify-center px-2 py-1">
                      {index + 1}
                    </Badge>

                    <div className="min-w-0 flex-1 text-sm font-medium">
                      <Badge
                        variant="secondary"
                        className="max-w-full truncate whitespace-nowrap px-3 py-1"
                        title={qaText}>
                        {qaText}
                      </Badge>
                    </div>

                    <RadioGroup
                      value={value}
                      onValueChange={(v) => {
                        if (isReadOnly) return;
                        if (v === value) return;
                        setValue(`items.${index}.isCorrect`, v === 'correct', { shouldDirty: true });
                      }}
                      disabled={isReadOnly || isSaving}
                      className="flex shrink-0 flex-nowrap items-center gap-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <RadioGroupItem value="correct" id={`kanji-correct-${field.id}`} />
                        <Label className="whitespace-nowrap" htmlFor={`kanji-correct-${field.id}`}>
                          正解
                        </Label>
                      </div>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <RadioGroupItem value="incorrect" id={`kanji-incorrect-${field.id}`} />
                        <Label className="whitespace-nowrap" htmlFor={`kanji-incorrect-${field.id}`}>
                          不正解
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                );
              })}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
