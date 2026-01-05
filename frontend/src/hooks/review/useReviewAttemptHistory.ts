import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import type { ReviewAttempt, SubjectId, UpsertReviewAttemptRequest } from '@smart-exam/api-types';

type FormValues = {
  dateYmd: string;
  isCorrect: boolean;
  memo: string;
};

type EditingAttempt = {
  previousDateYmd?: string;
};

export const useReviewAttemptHistory = (params: {
  targetType: 'QUESTION' | 'KANJI';
  targetId: string | null;
  subject: SubjectId | null;
  enabled?: boolean;
}) => {
  const enabled = params.enabled ?? true;

  const { items, status } = useWordTestStore((s) => s.reviewAttempt);
  const fetchReviewAttempts = useWordTestStore((s) => s.fetchReviewAttempts);
  const upsertReviewAttempt = useWordTestStore((s) => s.upsertReviewAttempt);

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<EditingAttempt | null>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      dateYmd: '',
      isCorrect: true,
      memo: '',
    },
  });

  const attempts = useMemo(() => {
    return [...items].sort((a, b) => (a.dateYmd === b.dateYmd ? 0 : a.dateYmd < b.dateYmd ? 1 : -1));
  }, [items]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    if (!params.targetId) return;
    await fetchReviewAttempts({ targetType: params.targetType, targetId: params.targetId });
  }, [enabled, params.targetId, params.targetType, fetchReviewAttempts]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startAdd = useCallback(() => {
    setEditing(null);
    form.reset({
      dateYmd: '',
      isCorrect: true,
      memo: '',
    });
    setIsOpen(true);
  }, [form]);

  const startEdit = useCallback(
    (a: ReviewAttempt) => {
      setEditing({ previousDateYmd: a.dateYmd });
      form.reset({
        dateYmd: a.dateYmd,
        isCorrect: a.isCorrect,
        memo: a.memo ?? '',
      });
      setIsOpen(true);
    },
    [form]
  );

  const submit = form.handleSubmit(async (data) => {
    if (!params.targetId || !params.subject) return;

    const req: UpsertReviewAttemptRequest = {
      targetType: params.targetType,
      targetId: params.targetId,
      subject: params.subject,
      dateYmd: data.dateYmd,
      isCorrect: data.isCorrect,
      memo: data.memo?.trim() ? data.memo.trim() : undefined,
      ...(editing?.previousDateYmd ? { previousDateYmd: editing.previousDateYmd } : {}),
    };

    await upsertReviewAttempt(req);
    setIsOpen(false);
    setEditing(null);
    await refresh();
  });

  return {
    attempts,
    isLoading: status.isLoading,
    error: status.error,
    isOpen,
    setIsOpen,
    form,
    startAdd,
    startEdit,
    submit,
  };
};
