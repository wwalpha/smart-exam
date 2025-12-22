import { useEffect, useState } from 'react';
import { useWordTestStore } from '@/stores';

export function useWordMasterPage() {
  const fetchWordGroups = useWordTestStore((s) => s.fetchWordGroups);
  const groups = useWordTestStore((s) => s.wordmaster.groups);
  const status = useWordTestStore((s) => s.wordmaster.status);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    void fetchWordGroups();
  }, [fetchWordGroups]);

  const openCreateDialog = () => setIsCreateDialogOpen(true);
  const closeCreateDialog = () => setIsCreateDialogOpen(false);

  return {
    groups,
    status,
    isCreateDialogOpen,
    openCreateDialog,
    closeCreateDialog,
  };
}
