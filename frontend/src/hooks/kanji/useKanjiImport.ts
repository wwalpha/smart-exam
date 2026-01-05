import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import type { ImportKanjiResponse } from '@smart-exam/api-types';
import { toast } from 'sonner';

type FormValues = {
  mode: 'SKIP' | 'UPDATE';
  subject: string;
  file: FileList;
};

export const useKanjiImport = () => {
  const navigate = useNavigate();
  const importKanji = useWordTestStore((s) => s.importKanji);
  const status = useWordTestStore((s) => s.kanji.status);
  const [result, setResult] = useState<ImportKanjiResponse | null>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      mode: 'SKIP',
      subject: '国語',
    },
  });

  const submit = async (data: FormValues) => {
    const subject = String(data.subject ?? '').trim();
    const file = data.file?.[0];
    if (!subject || !file) return;

    const fileName = String(file.name ?? '').toLowerCase();
    const extOk = fileName.endsWith('.txt') || fileName.endsWith('.csv');
    if (!extOk) {
      form.setError('file', {
        type: 'validate',
        message: 'テキストファイル（.txt / .csv）を選択してください。',
      });
      return;
    }

    const fileContent = await file.text();

    const response = await importKanji({
      fileContent,
      mode: data.mode,
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
  };
};
