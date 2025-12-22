import { useCallback, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import type { WordTestSubject } from '@typings/wordtest';

type FormValues = {
  subject: WordTestSubject | '';
  count: number;
};

export function useWordTestCreateDialog(params: { onClose: () => void }) {
  const createWordTest = useWordTestStore((s) => s.createWordTest);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      subject: '',
      count: 60,
    },
  });

  const selectedSubject = useWatch({ control, name: 'subject' });

  const isCreateDisabled = !selectedSubject || isSubmitting;

  const getSubjectClickHandler = useCallback(
    (value: WordTestSubject) => {
      return () => {
        setValue('subject', value, { shouldDirty: true });
      };
    },
    [setValue]
  );

  const onCreateClick = useMemo(() => {
    return handleSubmit(async (values) => {
      if (!values.subject) return;
      try {
        // 作成後の一覧反映は store 側で行うため、ここでは作成とクローズだけ行う
        await createWordTest(values.subject, values.count);
        params.onClose();
      } catch {
        // エラー表示は slice 側で管理し、ここでは握りつぶして未処理例外を避ける
      }
    });
  }, [createWordTest, handleSubmit, params]);

  return {
    register,
    selectedSubject,
    isSubmitting,
    isCreateDisabled,
    getSubjectClickHandler,
    onCreateClick,
  };
}
