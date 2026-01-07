import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';
import type { WordTestSubject } from '@typings/wordtest';
import type { ReviewMode } from '@smart-exam/api-types';

type SearchFormValues = {
  subject: 'ALL' | WordTestSubject;
  status: 'ALL' | 'IN_PROGRESS' | 'COMPLETED';
};

export const useReviewList = (params: { mode: ReviewMode; basePath: string }) => {
  const mode = params.mode;
  const basePath = params.basePath;

  const { list, total, status } = useWordTestStore((s) => s.review);
  const fetchReviewTests = useWordTestStore((s) => s.fetchReviewTests);
  const deleteReviewTest = useWordTestStore((s) => s.deleteReviewTest);
  const { confirm, ConfirmDialog } = useConfirm();
  
  const form = useForm<SearchFormValues>({
    defaultValues: {
      subject: 'ALL',
      status: 'ALL',
    }
  });

  const search = (data: SearchFormValues) => {
    fetchReviewTests({
      mode,
      subject: data.subject,
      ...(data.status === 'ALL' ? {} : { status: data.status }),
    });
  };

  useEffect(() => {
    fetchReviewTests({ mode, subject: 'ALL' });
  }, [fetchReviewTests, mode]);

  const remove = async (id: string) => {
    if (await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      await deleteReviewTest(id);
      fetchReviewTests({ mode, subject: 'ALL' });
    }
  };

  return {
    basePath,
    reviews: list,
    total,
    isLoading: status.isLoading,
    error: status.error,
    form,
    search: form.handleSubmit(search),
    remove,
    ConfirmDialog,
  };
};
