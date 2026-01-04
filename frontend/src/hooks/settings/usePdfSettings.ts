import { useForm } from 'react-hook-form';
import { useConfirm } from '@/components/common/useConfirm';

type PdfSettingsFormValues = {
  paperSize: string;
  orientation: string;
  fontSize: number;
  headerText: string;
  showDate: boolean;
};

export const usePdfSettings = () => {
  const { confirm, ConfirmDialog } = useConfirm();
  const form = useForm<PdfSettingsFormValues>({
    defaultValues: {
      paperSize: 'A4',
      orientation: 'portrait',
      fontSize: 12,
      headerText: '復習テスト',
      showDate: true,
    },
  });

  const { handleSubmit } = form;

  const submit = handleSubmit(async (data) => {
    console.log('Settings saved:', data);
    await confirm('設定を保存しました', { hideCancel: true });
  });

  return {
    form,
    submit,
    ConfirmDialog,
  };
};
