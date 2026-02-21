import { useCallback, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import type { WordTestSubject } from '@typings/wordtest';
import { useConfirm } from '@/components/common/useConfirm';

type FormValues = {
  title: string;
  subject: WordTestSubject | '';
  file: FileList;
};

export const useKanjiGroupCreateDialog = (params: { onClose: () => void }) => {
  const createWordGroup = useWordTestStore((s) => s.createWordGroup);
  const status = useWordTestStore((s) => s.kanjiGroup.status);
  const { confirm, ConfirmDialog } = useConfirm();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState,
  } = useForm<FormValues>({
    defaultValues: {
      title: '',
      subject: '',
    },
  });

  const selectedSubject = useWatch({ control, name: 'subject' });
  const file = useWatch({ control, name: 'file' });

  const isCreateDisabled = !selectedSubject || !file || file.length === 0 || status.isLoading;

  const getSubjectClickHandler = useCallback(
    (value: WordTestSubject) => {
      return () => {
        setValue('subject', value, { shouldDirty: true, shouldValidate: true });
      };
    },
    [setValue]
  );

  const onCreateClick = useMemo(() => {
    return handleSubmit(async (values) => {
      if (!values.subject || !values.file || values.file.length === 0) return;

      const file = values.file[0];
      const text = await file.text();
      const words = text
        .split('\n')
        .map((line) => {
          const [question, answer] = line.split('|');
          return { question: question?.trim(), answer: answer?.trim() };
        })
        .filter((item) => item.question && item.answer);

      if (words.length === 0) {
        await confirm('有効な単語データが見つかりませんでした。', { hideCancel: true });
        return;
      }

      await createWordGroup({
        title: values.title,
        subject: values.subject,
        words: words,
      });
      params.onClose();
    });
  }, [createWordGroup, handleSubmit, params, confirm]);

  return {
    formState,
    register,
    selectedSubject,
    isSubmitting: status.isLoading,
    isCreateDisabled,
    getSubjectClickHandler,
    onCreateClick,
    error: status.error,
    ConfirmDialog,
  };
}
