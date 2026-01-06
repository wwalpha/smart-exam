import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';

type FormValues = {
  from: string;
  to: string;
};

export const useReviewTargets = (params: { mode: 'QUESTION' | 'KANJI' }) => {
  const { items, status } = useWordTestStore((s) => s.reviewTargets);
  const fetchReviewTestTargets = useWordTestStore((s) => s.fetchReviewTestTargets);

  const form = useForm<FormValues>({
    defaultValues: {
      from: '',
      to: '',
    },
  });

  const submit = form.handleSubmit(async (data) => {
    await fetchReviewTestTargets({
      mode: params.mode,
      from: data.from,
      to: data.to,
    });
  });

  return {
    items,
    isLoading: status.isLoading,
    error: status.error,
    form,
    submit,
  };
};
