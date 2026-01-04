import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWordTestStore } from '@/stores';

type CreateFormValues = {
  subject: string;
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
