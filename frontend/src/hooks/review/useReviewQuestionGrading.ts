import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { compareQuestionNumber } from '@/utils/questionNumber';

type GradingFormValues = {
  items: {
    itemId: string;
    isCorrect: boolean;
  }[];
};

const BASE_PATH = '/exam/questions';

export const useReviewQuestionGrading = () => {
  const { id } = useParams<{ id: string }>();

  const { detail: currentTest, status } = useWordTestStore((s) => s.review);
  const fetchExam = useWordTestStore((s) => s.fetchExam);
  const submitExam = useWordTestStore((s) => s.submitExamResults);

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reviewSnapshot, setReviewSnapshot] = useState<typeof currentTest | null>(null);

  const sortMaterialItems = (items: NonNullable<typeof currentTest>['items']) => {
    return [...items].sort((a, b) => {
      const aKey = a.canonicalKey?.trim();
      const bKey = b.canonicalKey?.trim();

      if (aKey && bKey) return compareQuestionNumber(aKey, bKey);
      if (aKey) return -1;
      if (bKey) return 1;
      return a.id.localeCompare(b.id);
    });
  };

  const form = useForm<GradingFormValues>({ defaultValues: { items: [] } });
  const { control, handleSubmit, reset, setValue, getValues, watch } = form;

  const { fields } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (id) fetchExam(id);
  }, [id, fetchExam]);

  useEffect(() => {
    if (!currentTest) return;

    const nextItems = currentTest.mode === 'MATERIAL' ? sortMaterialItems(currentTest.items) : currentTest.items;
    setReviewSnapshot({
      ...currentTest,
      items: nextItems,
    });
    setHasLoadedOnce(true);
  }, [currentTest]);

  useEffect(() => {
    if (!reviewSnapshot) return;
    reset({
      items: reviewSnapshot.items.map((item) => ({
        itemId: item.itemId ?? item.id,
        isCorrect: item.isCorrect ?? true,
      })),
    });
  }, [reviewSnapshot, reset]);

  const submit = async (data: GradingFormValues) => {
    if (!id) return;
    setIsSaving(true);
    try {
      await submitExam(
        id,
        {
          results: data.items.map((item) => ({ id: item.itemId, isCorrect: item.isCorrect })),
        },
      );
      await fetchExam(id);
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
