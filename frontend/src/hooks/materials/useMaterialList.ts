import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';
import type { WordTestSubject } from '@typings/wordtest';

type SearchFormValues = {
  subject: 'ALL' | WordTestSubject;
  grade: string;
  provider: string;
  date: string;
  q: string;
};

export const useMaterialList = () => {
  const { list, total, status } = useWordTestStore((s) => s.material);
  const fetchMaterials = useWordTestStore((s) => s.fetchMaterials);
  const deleteMaterial = useWordTestStore((s) => s.deleteMaterial);
  
  const form = useForm<SearchFormValues>({
    defaultValues: {
      subject: 'ALL',
      grade: 'ALL',
      provider: '',
      date: '',
      q: '',
    }
  });

  const search = (data: SearchFormValues) => {
    fetchMaterials({
      subject: data.subject === 'ALL' ? undefined : data.subject,
      grade: data.grade === 'ALL' ? undefined : data.grade,
      provider: data.provider.trim() ? data.provider.trim() : undefined,
      ...(data.date ? { from: data.date, to: data.date } : {}),
      q: data.q,
    });
  };

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const { confirm, ConfirmDialog } = useConfirm();

  const remove = async (id: string) => {
    if (await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      await deleteMaterial(id);
    }
  };

  return {
    materials: list,
    total,
    isLoading: status.isLoading,
    error: status.error,
    form,
    search: form.handleSubmit(search),
    remove,
    ConfirmDialog,
  };
};
