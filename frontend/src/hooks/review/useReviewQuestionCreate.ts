import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import type { WordTestSubject } from '@typings/wordtest';

type CreateFormValues = {
  subject: WordTestSubject | '';
  count: number;
};

const BASE_PATH = '/exam/questions';

export const useReviewQuestionCreate = () => {
  const navigate = useNavigate();

  const createExam = useWordTestStore((s) => s.createExam);
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

    const newTest = await createExam({
      mode: 'QUESTION',
      subject: data.subject,
      count: Number(data.count),
    });

    if (newTest) {
      navigate(`${BASE_PATH}/${newTest.examId}`);
    }
  };

  return {
    form,
    submit: form.handleSubmit(submit),
    isLoading: status.isLoading,
    error: status.error,
  };
};
