import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';

type SearchFormValues = {
  q: string;
  reading: string;
  subject: string;
};

export const useKanjiList = () => {
  const { list, total, status } = useWordTestStore((s) => s.kanji);
  const fetchKanjiList = useWordTestStore((s) => s.fetchKanjiList);
  const deleteKanji = useWordTestStore((s) => s.deleteKanji);
  
  const form = useForm<SearchFormValues>({
    defaultValues: {
      q: '',
      reading: '',
      subject: 'ALL',
    }
  });

  const runSearch = (data: SearchFormValues) => {
    fetchKanjiList({
      q: data.q,
      reading: data.reading,
      subject: data.subject === 'ALL' ? undefined : data.subject,
    });
  };

  useEffect(() => {
    fetchKanjiList();
  }, [fetchKanjiList]);

  const { confirm, ConfirmDialog } = useConfirm();

  const remove = async (id: string) => {
    if (await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      await deleteKanji(id);
      fetchKanjiList();
    }
  };

  return {
    kanjiList: list,
    total,
    isLoading: status.isLoading,
    error: status.error,
    form,
    runSearch,
    remove,
    ConfirmDialog,
  };
};
