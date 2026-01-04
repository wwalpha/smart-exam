import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useWordTestDetailPage } from './useWordTestDetailPage';
import { useWordTestStore } from '@/stores';
import { GRADING_VALUE } from '@/lib/Consts';
import { useConfirm } from '@/components/common/useConfirm';
import type { WordTestItem } from '@typings/wordtest';

type GradingFormValues = {
  results: { isCorrect: boolean }[];
};

export const useWordTestGradingPage = () => {
  const { test, questions } = useWordTestDetailPage();
  const applyWordTestGrading = useWordTestStore((s) => s.applyWordTestGrading);
  const status = useWordTestStore((s) => s.wordtest.status);
  const { confirm, ConfirmDialog } = useConfirm();

  const form = useForm<GradingFormValues>({
    defaultValues: { results: [] },
  });

  const { reset, handleSubmit } = form;

  // Initialize form when questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      // Check if already graded
      const initialResults = questions.map((q: WordTestItem) => ({
        isCorrect: q.grading === GRADING_VALUE.correct
      }));
      reset({ results: initialResults });
    }
  }, [questions, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (!test?.id) return;
    const gradingData = questions.map((q: WordTestItem, i: number) => ({
      qid: q.qid,
      grading: data.results[i]?.isCorrect ? GRADING_VALUE.correct : GRADING_VALUE.incorrect,
    }));
    await applyWordTestGrading(test.id, gradingData);
    await confirm('採点を保存しました', { hideCancel: true });
  });

  return {
    test,
    questions,
    register: form.register,
    control: form.control,
    handleSubmit: form.handleSubmit,
    onSubmit,
    isSubmitting: status.isLoading,
    error: status.error,
    ConfirmDialog,
  };
}
