import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';

type SearchFormValues = {
  subject: string;
  grade: string;
  q: string;
};

export const useMaterialList = () => {
  const { list, total, status } = useWordTestStore((s) => s.material);
  const fetchMaterialSets = useWordTestStore((s) => s.fetchMaterialSets);
  
  const form = useForm<SearchFormValues>({
    defaultValues: {
      subject: 'ALL',
      grade: 'ALL',
      q: '',
    }
  });

  const search = (data: SearchFormValues) => {
    fetchMaterialSets({
      subject: data.subject === 'ALL' ? undefined : data.subject,
      grade: data.grade === 'ALL' ? undefined : data.grade,
      q: data.q,
    });
  };

  useEffect(() => {
    fetchMaterialSets();
  }, [fetchMaterialSets]);

  return {
    materials: list,
    total,
    isLoading: status.isLoading,
    error: status.error,
    form,
    search: form.handleSubmit(search),
  };
};
