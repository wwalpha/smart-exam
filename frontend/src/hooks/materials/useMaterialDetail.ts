import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';

export const useMaterialDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { detail, files, status } = useWordTestStore((s) => s.material);
  const fetchMaterialSet = useWordTestStore((s) => s.fetchMaterialSet);
  const fetchMaterialFiles = useWordTestStore((s) => s.fetchMaterialFiles);

  useEffect(() => {
    if (id) {
      fetchMaterialSet(id);
      fetchMaterialFiles(id);
    }
  }, [id, fetchMaterialSet, fetchMaterialFiles]);

  return {
    material: detail,
    files,
    isLoading: status.isLoading,
    error: status.error,
    id,
  };
};
