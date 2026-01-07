import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-[56px,1fr,96px,120px] items-center gap-3 rounded border px-3 py-2">
                    <div className="text-sm font-medium text-muted-foreground">{index + 1}</div>

                    <div className="min-w-0 text-sm font-medium">
                      <div className="truncate" title={qaText}>
                        {qaText}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      {isCorrect ? <Badge variant="default">正解</Badge> : <Badge variant="destructive">不正解</Badge>}
                    </div>

                    <label className="flex items-center justify-end gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={!isCorrect}
                        onChange={(ev) => {
                          setValue(`items.${index}.isCorrect`, !ev.target.checked, { shouldDirty: true });
                        }}
                      />
                      不正解
                    </label>
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
