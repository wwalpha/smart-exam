import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import type { ImportKanjiResponse } from '@smart-exam/api-types';
import { toast } from 'sonner';
import { SUBJECT } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

type FormValues = {
  mode: 'SKIP' | 'UPDATE';
  subject: WordTestSubject;
  file: FileList;
};

export const useKanjiImport = () => {
  const navigate = useNavigate();
  const importKanji = useWordTestStore((s) => s.importKanji);
  const status = useWordTestStore((s) => s.kanji.status);
  const [result, setResult] = useState<ImportKanjiResponse | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const form = useForm<FormValues>({
    defaultValues: {
      mode: 'SKIP',
      subject: SUBJECT.japanese,
    },
  });

  const resetUploadErrors = (): void => {
    setValidationErrors([]);
    setResult(null);
    form.clearErrors('file');
  };

  const submit = async (data: FormValues) => {
    resetUploadErrors();
    const subject = data.subject;
    const file = data.file?.[0];
    // 科目/ファイルが未指定の場合は送信を中断する
    if (!subject || !file) return;

    const fileName = String(file.name ?? '').toLowerCase();
    const extOk = fileName.endsWith('.txt');
    // フロント側で拡張子を先に弾き、不要なAPI呼び出しを防ぐ
    if (!extOk) {
      form.setError('file', {
        type: 'validate',
        message: 'テキストファイル（.txt）を選択してください。',
      });
      toast.error('ファイル形式が不正です');
      return;
    }

    const fileContent = await file.text();

    const lines = fileContent.split(/\r?\n/);
    const errors: string[] = [];
    for (let index = 0; index < lines.length; index += 1) {
      const raw = lines[index];
      const line = raw.trim();
      // 空行は無視する
      if (!line) continue;

      const parts = line.split('|').map((x) => x.trim());
      // pipe形式（問題|解答|履歴...）の最低限の列数チェック
      if (parts.length < 2) {
        errors.push(`形式が不正です（${index + 1}行目）。区切りは「|」を使用してください。`);
        continue;
      }

      const question = parts[0];
      const answer = parts[1];
      if (!question) {
        errors.push(`問題が空です（${index + 1}行目）。`);
      }
      if (!answer) {
        errors.push(`解答が空です（${index + 1}行目）。`);
      }

      for (const token of parts.slice(2)) {
        // 履歴が空トークンの場合はスキップする
        if (!token) continue;
        // 履歴は YYYY/MM/DD,OK|NG の固定形式のみ許可
        const ok = /^\d{4}\/\d{2}\/\d{2},(OK|NG)$/.test(token);
        if (!ok) {
          errors.push(
            `履歴の形式が不正です（${index + 1}行目）。「YYYY/MM/DD,OK」または「YYYY/MM/DD,NG」を指定してください。`
          );
        }
      }
    }

    // 1件でも形式エラーがある場合はAPI送信しない（サーバの部分登録を防ぐ）
    if (errors.length > 0) {
      setValidationErrors(errors);
      form.setError('file', {
        type: 'validate',
        message: '形式エラーがあります。内容を確認してください。',
      });
      toast.error('形式が不正です');
      return;
    }

    const response = await importKanji({
      fileContent,
      subject,
    });

    if (response.errorCount === 0) {
      toast.success('登録完了');
      navigate('/kanji');
      return;
    }

    setResult(response);
  };

  return {
    form,
    submit: form.handleSubmit(submit),
    isSubmitting: status.isLoading,
    result,
    navigate,
    error: status.error,
    validationErrors,
    resetUploadErrors,
  };
};
