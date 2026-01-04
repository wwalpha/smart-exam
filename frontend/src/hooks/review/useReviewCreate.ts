import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWordTestStore } from '@/stores';

type CreateFormValues = {
  subject: string;
  rangeFrom: string;
  rangeTo: string;
  count: number;
  includeCorrect: boolean;
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
      count: 20,
      includeCorrect: false,
    },
  });

  const submit = async (data: CreateFormValues) => {
    const newTest = await createReviewTest({
      mode,
      subject: data.subject,
      rangeFrom: data.rangeFrom ? new Date(data.rangeFrom).toISOString() : undefined,
      rangeTo: data.rangeTo ? new Date(data.rangeTo).toISOString() : undefined,
      count: Number(data.count),
      includeCorrect: data.includeCorrect,
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
