import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';
import type { WordTestSubject } from '@typings/wordtest';

type SearchFormValues = {
  subject: 'ALL' | WordTestSubject;
  status: 'ALL' | 'IN_PROGRESS' | 'COMPLETED';
  grade: string;
  provider: string;
  date: string;
  q: string;
};

const DEFAULT_SEARCH_VALUES: SearchFormValues = {
  subject: 'ALL',
  status: 'ALL',
  grade: 'ALL',
  provider: '',
  date: '',
  q: '',
};

export const useMaterialList = () => {
  const { list, total, status } = useWordTestStore((s) => s.material);
  const fetchMaterials = useWordTestStore((s) => s.fetchMaterials);
  const resetMaterialDetail = useWordTestStore((s) => s.resetMaterialDetail);
  const deleteMaterial = useWordTestStore((s) => s.deleteMaterial);
  
  const form = useForm<SearchFormValues>({
    defaultValues: DEFAULT_SEARCH_VALUES,
  });

  const search = (data: SearchFormValues) => {
    fetchMaterials({
      subject: data.subject === 'ALL' ? undefined : data.subject,
      status: data.status === 'ALL' ? undefined : data.status,
      grade: data.grade === 'ALL' ? undefined : data.grade,
      provider: data.provider.trim() ? data.provider.trim() : undefined,
      ...(data.date ? { from: data.date, to: data.date } : {}),
      q: data.q,
    });
  };

  const { confirm, ConfirmDialog } = useConfirm();

  const remove = async (id: string) => {
    if (await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      await deleteMaterial(id);
    }
  };

  const clear = async () => {
    form.reset(DEFAULT_SEARCH_VALUES);
    resetMaterialDetail();
  };

  return {
    materials: list,
    total,
    isLoading: status.isLoading,
    error: status.error,
    form,
    search: form.handleSubmit(search),
    clear,
    remove,
    ConfirmDialog,
  };
};
