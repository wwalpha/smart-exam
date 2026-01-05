import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import type { SubjectId } from '@smart-exam/api-types';

type FormValues = {
  grade: string;
  subject: SubjectId;
  category: string;
  name: string;
  questionFile: FileList;
  answerFile: FileList;
};

export const useExamPapers = () => {
  const { papers, status } = useWordTestStore((s) => s.exam);
  const fetchExamPapers = useWordTestStore((s) => s.fetchExamPapers);
  const createExamPaperWithUpload = useWordTestStore((s) => s.createExamPaperWithUpload);

  const form = useForm<FormValues>();
  const { handleSubmit, reset } = form;

  useEffect(() => {
    fetchExamPapers();
  }, [fetchExamPapers]);

  const submit = handleSubmit(async (data) => {
    await createExamPaperWithUpload({
      grade: data.grade,
      subject: data.subject,
      category: data.category,
      name: data.name,
      questionFile: data.questionFile[0],
      answerFile: data.answerFile[0],
    });
    reset();
  });

  return {
    papers,
    form,
    submit,
    isLoading: status.isLoading,
    error: status.error,
  };
};
