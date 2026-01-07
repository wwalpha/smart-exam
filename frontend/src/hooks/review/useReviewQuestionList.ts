import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';
import type { WordTestSubject } from '@typings/wordtest';

type SearchFormValues = {
  subject: 'ALL' | WordTestSubject;
  status: 'ALL' | 'IN_PROGRESS' | 'COMPLETED';
};

const BASE_PATH = '/reviewtests/questions';

export const useReviewQuestionList = () => {
  const { list, total, status } = useWordTestStore((s) => s.review);
  const fetchReviewTests = useWordTestStore((s) => s.fetchReviewTests);
  const deleteReviewTest = useWordTestStore((s) => s.deleteReviewTest);
  const { confirm, ConfirmDialog } = useConfirm();

  const form = useForm<SearchFormValues>({
    defaultValues: {
      subject: 'ALL',
      status: 'ALL',
    },
  });

  const search = (data: SearchFormValues) => {
    fetchReviewTests({
      mode: 'QUESTION',
      subject: data.subject,
      ...(data.status === 'ALL' ? {} : { status: data.status }),
    });
  };

  useEffect(() => {
    fetchReviewTests({ mode: 'QUESTION', subject: 'ALL' });
  }, [fetchReviewTests]);

  const remove = async (id: string) => {
    if (await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      await deleteReviewTest(id);
      fetchReviewTests({ mode: 'QUESTION', subject: 'ALL' });
    }
  };

  return {
    basePath: BASE_PATH,
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
