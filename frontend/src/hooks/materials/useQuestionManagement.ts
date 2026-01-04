import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';

type QuestionFormValues = {
  displayLabel: string;
  canonicalKey: string;
  category: string;
};

export const useQuestionManagement = () => {
  const { id } = useParams<{ id: string }>();
  const { questions, detail, status } = useWordTestStore((s) => s.material);
  const fetchQuestions = useWordTestStore((s) => s.fetchQuestions);
  const fetchMaterialSet = useWordTestStore((s) => s.fetchMaterialSet);
  const createQuestion = useWordTestStore((s) => s.createQuestion);
  const deleteQuestion = useWordTestStore((s) => s.deleteQuestion);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const form = useForm<QuestionFormValues>();
  const { reset } = form;
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    if (id) {
      fetchMaterialSet(id);
      fetchQuestions(id);
    }
  }, [id, fetchMaterialSet, fetchQuestions]);

  const submit = async (data: QuestionFormValues) => {
    if (!id || !detail) return;
    await createQuestion(id, {
      ...data,
      subject: detail.subject,
    });
    reset();
    setIsDialogOpen(false);
  };

  const remove = async (questionId: string) => {
    if (await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      await deleteQuestion(questionId);
      if (id) fetchQuestions(id);
    }
  };

  return {
    id,
    material: detail,
    questions,
    isLoading: status.isLoading,
    error: status.error,
    isDialogOpen,
    setIsDialogOpen,
    form,
    submit: form.handleSubmit(submit),
    remove,
    ConfirmDialog,
  };
};
