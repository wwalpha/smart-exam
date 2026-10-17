import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';
import type { MaterialListSearchValues } from '@typings/material';

const DEFAULT_SEARCH_VALUES: MaterialListSearchValues = {
  subject: 'ALL',
  status: 'IN_PROGRESS',
  grade: 'ALL',
  provider: '',
  date: '',
  q: '',
};

export const useMaterialList = () => {
  const { list, total, status, appliedSearch } = useWordTestStore((s) => s.material);
  const fetchMaterials = useWordTestStore((s) => s.fetchMaterials);
  const setMaterialListSearch = useWordTestStore((s) => s.setMaterialListSearch);
  const resetMaterialDetail = useWordTestStore((s) => s.resetMaterialDetail);
  const deleteMaterial = useWordTestStore((s) => s.deleteMaterial);
  
  const form = useForm<MaterialListSearchValues>({
    defaultValues: appliedSearch ?? DEFAULT_SEARCH_VALUES,
  });

  const search = async (data: MaterialListSearchValues) => {
    const params = {
      subject: data.subject === 'ALL' ? undefined : data.subject,
      status: data.status === 'ALL' ? undefined : data.status,
      grade: data.grade === 'ALL' ? undefined : data.grade,
      provider: data.provider.trim() ? data.provider.trim() : undefined,
      ...(data.date ? { from: data.date, to: data.date } : {}),
      q: data.q,
    };
    try {
      await fetchMaterials(params);
      setMaterialListSearch(data);
    } catch {
      // エラーは store に保持されるため、保存済み条件を維持して再送出しない。
    }
  };

  const { confirm, ConfirmDialog } = useConfirm();

  const remove = async (id: string) => {
    if (await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      await deleteMaterial(id);
    }
  };

  const clear = async () => {
    form.reset(DEFAULT_SEARCH_VALUES);
    setMaterialListSearch(null);
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
