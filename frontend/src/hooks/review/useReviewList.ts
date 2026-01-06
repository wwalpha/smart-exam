import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';
import type { WordTestSubject } from '@typings/wordtest';

type SearchFormValues = {
  subject: 'ALL' | WordTestSubject;
  status: 'ALL' | 'IN_PROGRESS' | 'COMPLETED';
};

export const useReviewList = () => {
  const location = useLocation();
  const isKanji = location.pathname.includes('/kanji');
  const mode = isKanji ? 'KANJI' : 'QUESTION';
  const basePath = isKanji ? '/reviewtests/kanji' : '/reviewtests/questions';

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
    isKanji,
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
