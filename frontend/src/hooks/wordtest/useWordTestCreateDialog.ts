import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';

type FormValues = {
  name: string;
  subject: string;
  source_id: string;
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

  const { register, handleSubmit, setValue, watch } = form;

  const onCreateClick = handleSubmit(async (data) => {
    await createWordTest({
      name: data.name,
      subject: data.subject as any,
      source_id: data.source_id,
      count: Number(data.count),
    });
    params.onClose();
  });

  return {
    register,
    setValue,
    watch,
    groups,
    isCreateDisabled: status.isLoading,
    onCreateClick,
    error: status.error,
  };
}
