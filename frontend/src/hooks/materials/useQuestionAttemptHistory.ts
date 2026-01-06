import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import type { Question, SubjectId, UpsertReviewAttemptRequest } from '@smart-exam/api-types';

type FormValues = {
  dateYmd: string;
  isCorrect: boolean;
  memo: string;
};

export const useQuestionAttemptHistory = (params: { subject: SubjectId | null; questions: Question[] }) => {
  const { items, status } = useWordTestStore((s) => s.reviewAttempt);
  const fetchReviewAttempts = useWordTestStore((s) => s.fetchReviewAttempts);
  const upsertReviewAttempt = useWordTestStore((s) => s.upsertReviewAttempt);
  const deleteReviewAttempt = useWordTestStore((s) => s.deleteReviewAttempt);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [previousDateYmd, setPreviousDateYmd] = useState<string | null>(null);

  const selectedQuestion = useMemo(() => {
    if (!selectedQuestionId) return null;
    return params.questions.find((q) => q.id === selectedQuestionId) ?? null;
  }, [params.questions, selectedQuestionId]);

  const attempts = useMemo(() => {
    return [...items].sort((a, b) => (a.dateYmd === b.dateYmd ? 0 : a.dateYmd < b.dateYmd ? 1 : -1));
  }, [items]);

  const form = useForm<FormValues>({
    defaultValues: {
      dateYmd: '',
      isCorrect: true,
      memo: '',
    },
  });

  const refresh = useCallback(async () => {
    if (!selectedQuestionId) return;
    await fetchReviewAttempts({ targetType: 'QUESTION', targetId: selectedQuestionId });
  }, [selectedQuestionId, fetchReviewAttempts]);

  useEffect(() => {
    if (!isOpen) return;
    refresh();
  }, [isOpen, refresh]);

  const openForQuestion = useCallback(
    (questionId: string) => {
      setSelectedQuestionId(questionId);
      setPreviousDateYmd(null);
      form.reset({ dateYmd: '', isCorrect: true, memo: '' });
      setIsOpen(true);
    },
    [form]
  );

  const startEdit = useCallback(
    (attempt: { dateYmd: string; isCorrect: boolean; memo?: string }) => {
      setPreviousDateYmd(attempt.dateYmd);
      form.reset({
        dateYmd: attempt.dateYmd,
        isCorrect: attempt.isCorrect,
        memo: attempt.memo ?? '',
      });
    },
    [form]
  );

  const submit = form.handleSubmit(async (data) => {
    if (!selectedQuestionId) return;
    if (!params.subject) return;

    const request: UpsertReviewAttemptRequest = {
      targetType: 'QUESTION',
      targetId: selectedQuestionId,
      subject: params.subject,
      dateYmd: data.dateYmd,
      isCorrect: data.isCorrect,
      memo: data.memo?.trim() ? data.memo.trim() : undefined,
      ...(previousDateYmd ? { previousDateYmd } : {}),
    };

    await upsertReviewAttempt(request);
    await refresh();
    setPreviousDateYmd(null);
    form.reset({ dateYmd: '', isCorrect: true, memo: '' });
  });

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedQuestionId(null);
    setPreviousDateYmd(null);
    form.reset({ dateYmd: '', isCorrect: true, memo: '' });
  }, [form]);

  const remove = useCallback(
    async (dateYmd: string) => {
      if (!selectedQuestionId) return;
      await deleteReviewAttempt({
        targetType: 'QUESTION',
        targetId: selectedQuestionId,
        dateYmd,
      });
      await refresh();
    },
    [selectedQuestionId, deleteReviewAttempt, refresh]
  );

  return {
    isOpen,
    selectedQuestion,
    attempts,
    isLoading: status.isLoading,
    error: status.error,
    form,
    openForQuestion,
    startEdit,
    submit,
    remove,
    close,
  };
};
