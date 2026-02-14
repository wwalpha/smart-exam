import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import type { WordTestSubject } from '@typings/wordtest';
import { SUBJECT } from '@/lib/Consts';
import { toast } from 'sonner';
import { getApiErrorCodes } from '@/services/apiClient';

type CreateFormValues = {
  subject: WordTestSubject | '';
  count: number;
};

const BASE_PATH = '/exam/kanji';

export const useReviewKanjiCreate = () => {
  const navigate = useNavigate();

  const createExam = useWordTestStore((s) => s.createExam);
  const status = useWordTestStore((s) => s.review.status);

  const form = useForm<CreateFormValues>({
    defaultValues: {
      subject: SUBJECT.japanese,
      count: 60,
    },
  });

  const submit = async (data: CreateFormValues) => {
    if (!data.subject) {
      form.setError('subject', { type: 'required', message: '必須です' });
      return;
    }

    try {
      const newTest = await createExam({
        mode: 'KANJI',
        subject: data.subject,
        count: Number(data.count),
      });

      if (newTest) {
        navigate(`${BASE_PATH}/${newTest.id}`);
      }
    } catch (error) {
      const apiErrors = getApiErrorCodes(error);

      if (apiErrors.includes('no_printable_items')) {
        toast.error('印刷可能な漢字問題がありません');
        return;
      }

      toast.error('復習テストの作成に失敗しました');
    }
  };

  return {
    form,
    submit: form.handleSubmit(submit),
    isLoading: status.isLoading,
    error: status.error,
  };
};
