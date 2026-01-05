import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import type { SubjectId } from '@smart-exam/api-types';

type FormValues = {
  grade: string;
  subject: SubjectId;
  category: string;
  name: string;
  title: string;
  testDate: string;
  gradedFile: FileList;
  details: { number: number; isCorrect: boolean }[];
};

export const useExamResults = () => {
  const { results, papers, status } = useWordTestStore((s) => s.exam);
  const fetchExamResults = useWordTestStore((s) => s.fetchExamResults);
  const fetchExamPapers = useWordTestStore((s) => s.fetchExamPapers);
  const createExamResultWithUpload = useWordTestStore((s) => s.createExamResultWithUpload);

  const form = useForm<FormValues>({
    defaultValues: {
      details: Array.from({ length: 10 }).map((_, i) => ({ number: i + 1, isCorrect: false })),
    },
  });

  const { control, handleSubmit, reset } = form;

  const fieldArray = useFieldArray({
    control,
    name: 'details',
  });

  useEffect(() => {
    fetchExamResults();
    fetchExamPapers();
  }, [fetchExamResults, fetchExamPapers]);

  const submit = handleSubmit(async (data) => {
    await createExamResultWithUpload({
      grade: data.grade,
      subject: data.subject,
      category: data.category,
      name: data.name,
      title: data.title,
      testDate: data.testDate,
      gradedFile: data.gradedFile?.[0],
      details: data.details.map((d) => ({ ...d, isCorrect: Boolean(d.isCorrect) })),
    });
    reset();
  });

  return {
    results,
    papers,
    isLoading: status.isLoading,
    form,
    fieldArray,
    submit,
    error: status.error,
  };
};
