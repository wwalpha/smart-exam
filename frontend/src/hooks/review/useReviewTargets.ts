import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { format, subYears } from 'date-fns';
import type { ReviewMode } from '@smart-exam/api-types';

type FormValues = {
  from: string;
  to: string;
};

export const useReviewTargets = (params: { mode: ReviewMode }) => {
  const { items, status } = useWordTestStore((s) => s.reviewTargets);
  const fetchReviewTestTargets = useWordTestStore((s) => s.fetchReviewTestTargets);

  const today = new Date();
  const defaultTo = format(today, 'yyyy-MM-dd');
  const defaultFrom = format(subYears(today, 1), 'yyyy-MM-dd');

  const form = useForm<FormValues>({
    defaultValues: {
      from: defaultFrom,
      to: defaultTo,
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
