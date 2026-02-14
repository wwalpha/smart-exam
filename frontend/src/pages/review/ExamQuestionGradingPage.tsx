import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatYmdSlash } from '@/utils/date';
import { useReviewQuestionGrading } from '@/hooks/review';

export const ExamQuestionGradingPage = () => {
  const { review, isInitialLoading, isSaving, error, basePath, fields, watch, setValue, setAllCorrect, submit, id } =
    useReviewQuestionGrading();

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

            {(() => {
              const entries = fields
                .map((field, index) => ({
                  field,
                  index,
                  item: review.items[index],
                  isCorrect: watch(`items.${index}.isCorrect`) ?? true,
                }))
                .filter((x) => !!x.item);

              const blocks: Array<{
                key: string;
                grade: string;
                provider: string;
                materialDate: string;
                materialName: string;
                items: typeof entries;
              }> = [];
              const byKey = new Map<string, (typeof blocks)[number]>();

              for (const e of entries) {
                const grade = e.item?.grade ?? '';
                const provider = e.item?.provider ?? '';
                const materialDate = e.item?.materialDate ?? '';
                const materialName = e.item?.materialName ?? '';
                const key = [grade, provider, materialDate, materialName].join('||');

                const existing = byKey.get(key);
                if (existing) {
                  existing.items.push(e);
                  continue;
                }

                const created = {
                  key,
                  grade,
                  provider,
                  materialDate,
                  materialName,
                  items: [e],
                };
                byKey.set(key, created);
                blocks.push(created);
              }

              return (
                <div className="space-y-3">
                  {blocks.map((b) => (
                    <div key={b.key} className="rounded border">
                      <div className="border-b px-3 py-2">
                        <div className="text-sm font-medium">
                          {[b.grade, b.provider, b.materialDate ? formatYmdSlash(b.materialDate) : '', b.materialName]
                            .filter((v) => String(v).trim().length > 0)
                            .join(' ')}
                        </div>
                      </div>

                      <div className="p-3">
                        <div className="space-y-2">
                          {b.items.map((e) => (
                            <div
                              key={e.field.id}
                              className="flex items-center justify-between gap-3 rounded border px-3 py-2">

                              <div className="flex shrink-0 items-center gap-3">
                                {e.isCorrect ? (
                                  <Badge variant="default">正解</Badge>
                                ) : (
                                  <Badge variant="destructive">不正解</Badge>
                                )}
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={!e.isCorrect}
                                    onChange={(ev) => {
                                      setValue(`items.${e.index}.isCorrect`, !ev.target.checked, { shouldDirty: true });
                                    }}
                                  />
                                  不正解
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
