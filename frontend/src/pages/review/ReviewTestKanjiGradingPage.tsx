import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useReviewKanjiGrading } from '@/hooks/review';

export const ReviewTestKanjiGradingPage = () => {
  const { review, isInitialLoading, isSaving, error, basePath, fields, watch, setValue, setAllCorrect, submit, id } =
    useReviewKanjiGrading();

  if (isInitialLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!review) return <div className="p-8">データの取得に失敗しました。</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-end">
        <Button asChild variant="outline">
          <Link to={`${basePath}/${id}`}>戻る</Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={submit}>
            <div className="mb-4 flex items-center justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={setAllCorrect} disabled={isSaving}>
                全問正解
              </Button>
              <Button type="submit" disabled={isSaving}>
                保存
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => {
                const item = review.items[index];
                if (!item) return null;

                const isCorrect = watch(`items.${index}.isCorrect`) ?? true;
                const qaText = [item.questionText, item.answerText].filter((v) => (v ?? '').trim().length > 0).join(' / ');
                const value = isCorrect ? 'correct' : 'incorrect';

                return (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 rounded border px-3 py-2">
                    <div className="w-14 shrink-0 text-sm font-medium text-muted-foreground">{index + 1}</div>

                    <div className="min-w-0 flex-1 text-sm font-medium">
                      <div className="truncate whitespace-nowrap" title={qaText}>
                        {qaText}
                      </div>
                    </div>

                    <RadioGroup
                      value={value}
                      onValueChange={(v) => {
                        if (v === value) return;
                        setValue(`items.${index}.isCorrect`, v === 'correct', { shouldDirty: true });
                      }}
                      className="flex shrink-0 items-center gap-4 whitespace-nowrap">
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
