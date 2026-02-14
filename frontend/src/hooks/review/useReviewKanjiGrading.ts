import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { toast } from 'sonner';

type GradingFormValues = {
  items: {
    itemId: string;
    isCorrect: boolean;
  }[];
};

const BASE_PATH = '/reviewtests/kanji';

export const useReviewKanjiGrading = () => {
  const { id } = useParams<{ id: string }>();

  const { detail: currentTest, status } = useWordTestStore((s) => s.review);
  const fetchReviewTest = useWordTestStore((s) => s.fetchReviewTest);
  const submitReviewTest = useWordTestStore((s) => s.submitReviewTestResults);

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reviewSnapshot, setReviewSnapshot] = useState<typeof currentTest | null>(null);

  const form = useForm<GradingFormValues>({ defaultValues: { items: [] } });
  const { control, handleSubmit, reset, setValue, getValues, watch } = form;

  const { fields } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (id) fetchReviewTest(id, 'KANJI');
  }, [id, fetchReviewTest]);

  useEffect(() => {
    if (!currentTest) return;
    setReviewSnapshot(currentTest);
    setHasLoadedOnce(true);
  }, [currentTest]);

  useEffect(() => {
    if (!currentTest) return;
    reset({
      items: currentTest.items.map((item) => ({
        itemId: item.itemId ?? item.id,
        isCorrect: item.isCorrect ?? true,
      })),
    });
  }, [currentTest, reset]);

  const submit = async (data: GradingFormValues) => {
    if (!id) return;
    setIsSaving(true);
    try {
      await submitReviewTest(
        id,
        {
          results: data.items.map((item) => ({ id: item.itemId, isCorrect: item.isCorrect })),
        },
        'KANJI',
      );
      await fetchReviewTest(id, 'KANJI');
      toast.success('保存しました');
    } catch (e) {
      toast.error('保存に失敗しました');
      throw e;
    } finally {
      setIsSaving(false);
    }
  };

  const setAllCorrect = () => {
    const current = getValues('items');
    current.forEach((_, index) => {
      setValue(`items.${index}.isCorrect`, true, { shouldDirty: true });
    });
  };

  return {
    id,
    review: reviewSnapshot,
    isInitialLoading: status.isLoading && !hasLoadedOnce,
    isSaving,
    error: status.error,
    basePath: BASE_PATH,
    fields,
    watch,
    setValue,
    setAllCorrect,
    submit: handleSubmit(submit),
  };
};
