import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useWordTestStore } from '@/stores';

type GradingFormValues = {
  items: {
    itemId: string;
    isCorrect: boolean;
  }[];
};

export const useReviewGrading = (params: { basePath: string }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const basePath = params.basePath;

  const { detail: currentTest, status } = useWordTestStore((s) => s.review);
  const fetchReviewTest = useWordTestStore((s) => s.fetchReviewTest);
  const submitReviewTest = useWordTestStore((s) => s.submitReviewTestResults);

  const form = useForm<GradingFormValues>({
    defaultValues: { items: [] },
  });
  
  const { control, handleSubmit, reset, setValue, getValues, watch } = form;
  
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
          itemId: item.id,
          isCorrect: item.isCorrect ?? false,
        })),
      });
    }
  }, [currentTest, reset]);

  const submit = async (data: GradingFormValues) => {
    if (!id) return;
    await submitReviewTest(id, {
      results: data.items.map((item) => ({
        id: item.itemId,
        isCorrect: item.isCorrect,
      })),
    });
    navigate(`${basePath}/${id}`);
  };

  const setAllCorrect = () => {
    const current = getValues('items');
    current.forEach((_, index) => {
      setValue(`items.${index}.isCorrect`, true, { shouldDirty: true });
    });
  };

  return {
    id,
    review: currentTest,
    isLoading: status.isLoading,
    error: status.error,
    basePath,
    form,
    register: form.register,
    setValue,
    watch,
    setAllCorrect,
    fields,
    submit: handleSubmit(submit),
  };
};
