import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';
import type { WordTestSubject } from '@typings/wordtest';

type SearchFormValues = {
  subject: 'ALL' | WordTestSubject;
  status: 'ALL' | 'IN_PROGRESS' | 'COMPLETED';
};

const BASE_PATH = '/reviewtests/kanji';

export const useReviewKanjiList = () => {
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
      mode: 'KANJI',
      subject: data.subject,
      ...(data.status === 'ALL' ? {} : { status: data.status }),
    });
  };

  const remove = async (id: string) => {
    if (await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      await deleteReviewTest(id, 'KANJI');
      const current = form.getValues();
      fetchReviewTests({
        mode: 'KANJI',
        subject: current.subject,
        ...(current.status === 'ALL' ? {} : { status: current.status }),
      });
    }
  };

  return {
    basePath: BASE_PATH,
    // storeはKANJI/QUESTIONで共通のため、画面側でモード一致のみ表示する
    reviews: list.filter((x) => x.mode === 'KANJI'),
    total,
    isLoading: status.isLoading,
    error: status.error,
    form,
    search: form.handleSubmit(search),
    remove,
    ConfirmDialog,
  };
};
