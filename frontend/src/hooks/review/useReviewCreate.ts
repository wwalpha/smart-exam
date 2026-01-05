import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import type { WordTestSubject } from '@typings/wordtest';

type CreateFormValues = {
  subject: WordTestSubject | '';
  count: number;
};

export const useReviewCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isKanji = location.pathname.includes('/kanji');
  const mode = isKanji ? 'KANJI' : 'QUESTION';
  const basePath = isKanji ? '/reviewtests/kanji' : '/reviewtests/questions';

  const createReviewTest = useWordTestStore((s) => s.createReviewTest);
  const status = useWordTestStore((s) => s.review.status);
  
  const form = useForm<CreateFormValues>({
    defaultValues: {
      subject: '',
      count: 20,
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
    isKanji,
    form,
    submit: form.handleSubmit(submit),
    isLoading: status.isLoading,
    error: status.error,
  };
};
