import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useKanjiImport } from '@/hooks/kanji';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';
import { useRef } from 'react';

export const KanjiImportPage = () => {
  const { form, submit, isSubmitting, error, validationErrors, resetUploadErrors } = useKanjiImport();
  const { register, setValue, watch } = form;
  const subject = watch('subject');
  const fileList = watch('file');
  const selectedFileName = fileList?.[0]?.name;
  const subjectErrorMessage = form.formState.errors.subject?.message;
  const fileErrorMessage = form.formState.errors.file?.message;

  const fileRegister = register('file', { required: '必須です' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-6 p-8 max-w-3xl mx-auto pt-4">
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2 pt-4">
              <Label>科目（必須）</Label>
              <input type="hidden" {...register('subject', { required: '必須です' })} />
              <Select
                value={subject}
                onValueChange={(v) =>
                  setValue('subject', v as WordTestSubject, { shouldDirty: true, shouldValidate: true })
                }
              >
                <SelectTrigger
                  aria-invalid={!!form.formState.errors.subject}
                  className={form.formState.errors.subject ? 'border-destructive focus:ring-destructive' : undefined}
                >
                  <SelectValue placeholder="科目を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SUBJECT.japanese}>{SUBJECT_LABEL[SUBJECT.japanese]}</SelectItem>
                  <SelectItem value={SUBJECT.society}>{SUBJECT_LABEL[SUBJECT.society]}</SelectItem>
                </SelectContent>
              </Select>
              {subjectErrorMessage ? <p className="text-sm text-destructive">{String(subjectErrorMessage)}</p> : null}
            </div>

            <div className="space-y-3 rounded-md border p-4">
              <Label>ファイル</Label>
              <p className="text-sm text-muted-foreground">
                形式: 問題|解答|YYYY/MM/DD,OK|YYYY/MM/DD,NG (1行1件 / DATEは任意)
              </p>
              <Input
                ref={(el) => {
                  fileInputRef.current = el;
                  fileRegister.ref(el);
                }}
                type="file"
                accept="text/plain,.txt"
                className="sr-only"
                name={fileRegister.name}
                onBlur={fileRegister.onBlur}
                onChange={(e) => {
                  resetUploadErrors();
                  fileRegister.onChange(e);
                }}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  aria-invalid={!!form.formState.errors.file}
                  className={
                    form.formState.errors.file
                      ? 'border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive'
                      : undefined
                  }
                >
                  ファイル選択
                </Button>
                <div className="text-sm text-muted-foreground break-all">
                  {selectedFileName ? `選択中: ${selectedFileName}` : '未選択'}
                </div>
              </div>
              {fileErrorMessage ? <p className="text-sm text-destructive">{fileErrorMessage}</p> : null}
              {validationErrors.length > 0 ? (
                <div className="space-y-1">
                  {validationErrors.map((message, index) => (
                    <p key={index} className="text-sm text-destructive break-words">
                      {message}
                    </p>
                  ))}
                </div>
              ) : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '登録中...' : '登録'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
