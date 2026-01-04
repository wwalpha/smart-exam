import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useWordTestStore } from '@/stores';

type GradingFormValues = {
  items: {
    itemId: string;
    isCorrect: boolean;
  }[];
};

export const useReviewGrading = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isKanji = location.pathname.includes('/kanji');
  const basePath = isKanji ? '/reviewtests/kanji' : '/reviewtests/questions';

  const { detail: currentTest, status } = useWordTestStore((s) => s.review);
  const fetchReviewTest = useWordTestStore((s) => s.fetchReviewTest);
  const submitReviewTest = useWordTestStore((s) => s.submitReviewTestResults);

  const form = useForm<GradingFormValues>({
    defaultValues: { items: [] },
  });
  
  const { control, handleSubmit, reset } = form;
  
  const { fields } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    if (id) {
      fetchReviewTest(id);
    }
  }, [id, fetchReviewTest]);

  useEffect(() => {
    if (currentTest) {
      reset({
        items: currentTest.items.map((item) => ({
          itemId: item.itemId,
          isCorrect: item.isCorrect ?? false,
        })),
      });
    }
  }, [currentTest, reset]);

  const submit = async (data: GradingFormValues) => {
    if (!id) return;
    await submitReviewTest(id, { results: data.items.map(item => ({
        targetId: item.itemId,
        isCorrect: item.isCorrect,
      })) 
    });
    navigate(`${basePath}/${id}`);
  };

  return {
    id,
    review: currentTest,
    isLoading: status.isLoading,
    error: status.error,
    basePath,
    form,
    register: form.register,
    fields,
    submit: handleSubmit(submit),
  };
};
