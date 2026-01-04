import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import type { ImportKanjiResponse } from '@smart-exam/api-types';

type FormValues = {
  textData: string;
  mode: 'SKIP' | 'UPDATE';
  subject?: string;
};

export const useKanjiImport = () => {
  const navigate = useNavigate();
  const importKanji = useWordTestStore((s) => s.importKanji);
  const status = useWordTestStore((s) => s.kanji.status);
  const [result, setResult] = useState<ImportKanjiResponse | null>(null);

  const form = useForm<FormValues>({
    defaultValues: { mode: 'SKIP' },
  });

  const submit = async (data: FormValues) => {
    if (!data.textData) return;

    const response = await importKanji({
      fileContent: data.textData,
      mode: data.mode,
      subject: data.subject || undefined,
    });
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
