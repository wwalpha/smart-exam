import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import type { WordTestSubject } from '@typings/wordtest';
import type { ReviewMode } from '@smart-exam/api-types';

type CreateFormValues = {
  subject: WordTestSubject | '';
  count: number;
};

export const useReviewCreate = (params: { mode: ReviewMode; basePath: string }) => {
  const navigate = useNavigate();
  const mode = params.mode;
  const basePath = params.basePath;

  const createReviewTest = useWordTestStore((s) => s.createReviewTest);
  const status = useWordTestStore((s) => s.review.status);
  
  const form = useForm<CreateFormValues>({
    defaultValues: {
      subject: '',
      count: mode === 'KANJI' ? 60 : 20,
    },
  });

  const submit = async (data: CreateFormValues) => {
    if (!data.subject) {
      form.setError('subject', { type: 'required', message: '必須です' });
      return;
    }
    const newTest = await createReviewTest({
      mode,
      subject: data.subject,
      count: Number(data.count),
    });
    
    if (newTest) {
      navigate(`${basePath}/${newTest.id}`);
    }
  };

  return {
    form,
    submit: form.handleSubmit(submit),
    isLoading: status.isLoading,
    error: status.error,
  };
};
