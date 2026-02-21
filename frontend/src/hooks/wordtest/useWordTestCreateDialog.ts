import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import type { WordTestSubject } from '@typings/wordtest';

type FormValues = {
  name: string;
  subject: WordTestSubject;
  sourceId: string;
  count: number;
};

export const useWordTestCreateDialog = (params: { onClose: () => void }) => {
  const createWordTest = useWordTestStore((s) => s.createWordTest);
  const groups = useWordTestStore((s) => s.kanjiGroup.groups);
  const status = useWordTestStore((s) => s.wordtest.status);

  const form = useForm<FormValues>({
    defaultValues: {
      count: 20,
    },
  });

  const { register, handleSubmit, setValue, watch, formState } = form;

  const onCreateClick = handleSubmit(async (data) => {
    await createWordTest({
      name: data.name,
      subject: data.subject,
      sourceId: data.sourceId,
      count: Number(data.count),
    });
    params.onClose();
  });

  return {
    formState,
    register,
    setValue,
    watch,
    groups,
    isCreateDisabled: status.isLoading,
    onCreateClick,
    error: status.error,
  };
}
