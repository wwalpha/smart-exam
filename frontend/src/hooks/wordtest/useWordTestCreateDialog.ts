import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';

type FormValues = {
  name: string;
  subject: string;
  sourceId: string;
  count: number;
};

export const useWordTestCreateDialog = (params: { onClose: () => void }) => {
  const createWordTest = useWordTestStore((s) => s.createWordTest);
  const groups = useWordTestStore((s) => s.wordmaster.groups);
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
      subject: data.subject as any,
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
