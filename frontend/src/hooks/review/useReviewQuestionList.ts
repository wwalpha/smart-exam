import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';
import type { WordTestSubject } from '@typings/wordtest';

type SearchFormValues = {
  subject: 'ALL' | WordTestSubject;
  status: 'ALL' | 'IN_PROGRESS' | 'COMPLETED';
};

const BASE_PATH = '/exam/questions';

export const useReviewQuestionList = () => {
  const { list, total, status } = useWordTestStore((s) => s.review);
  const fetchExams = useWordTestStore((s) => s.fetchExams);
  const deleteExam = useWordTestStore((s) => s.deleteExam);
  const { confirm, ConfirmDialog } = useConfirm();

  const form = useForm<SearchFormValues>({
    defaultValues: {
      subject: 'ALL',
      status: 'ALL',
    },
  });

  const search = (data: SearchFormValues) => {
    fetchExams({
      mode: 'MATERIAL',
      subject: data.subject,
      ...(data.status === 'ALL' ? {} : { status: data.status }),
    });
  };

  const remove = async (id: string) => {
    if (await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      await deleteExam(id);
      const current = form.getValues();
      fetchExams({
        mode: 'MATERIAL',
        subject: current.subject,
        ...(current.status === 'ALL' ? {} : { status: current.status }),
      });
    }
  };

  return {
    basePath: BASE_PATH,
    // storeはKANJI/MATERIALで共通のため、画面側でモード一致のみ表示する
    reviews: list.filter((x) => x.mode === 'MATERIAL'),
    total,
    isLoading: status.isLoading,
    error: status.error,
    form,
    search: form.handleSubmit(search),
    remove,
    ConfirmDialog,
  };
};
