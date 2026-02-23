import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import type { WordTestSubject } from '@typings/wordtest';

type CreateFormValues = {
  subject: WordTestSubject | '';
  count: number;
  materialIds: string[];
};

const BASE_PATH = '/exam/questions';

export const useReviewQuestionCreate = () => {
  const navigate = useNavigate();

  const createExam = useWordTestStore((s) => s.createExam);
  const fetchOpenCandidateMaterials = useWordTestStore((s) => s.fetchOpenCandidateMaterials);
  const openCandidateList = useWordTestStore((s) => s.material.openCandidateList);
  const openCandidateTotal = useWordTestStore((s) => s.material.openCandidateTotal);
  const status = useWordTestStore((s) => s.review.status);

  const form = useForm<CreateFormValues>({
    defaultValues: {
      subject: '',
      count: 20,
      materialIds: [],
    },
  });

  const subject = form.watch('subject');

  useEffect(() => {
    if (!subject) {
      form.setValue('materialIds', [], { shouldDirty: true, shouldValidate: true });
      return;
    }

    // 科目切替時は候補対象が変わるため、選択中教材をクリアしてから再取得する。
    form.setValue('materialIds', [], { shouldDirty: true, shouldValidate: true });
    void fetchOpenCandidateMaterials({ subject });
  }, [fetchOpenCandidateMaterials, form, subject]);

  const submit = async (data: CreateFormValues) => {
    if (!data.subject) {
      form.setError('subject', { type: 'required', message: '必須です' });
      return;
    }

    const newTest = await createExam({
      mode: 'MATERIAL',
      subject: data.subject,
      count: Number(data.count),
      materialIds: data.materialIds,
    });

    if (newTest) {
      navigate(`${BASE_PATH}/${newTest.examId}`);
    }
  };

  return {
    form,
    subject,
    openCandidateList,
    openCandidateTotal,
    submit: form.handleSubmit(submit),
    isLoading: status.isLoading,
    error: status.error,
  };
};
