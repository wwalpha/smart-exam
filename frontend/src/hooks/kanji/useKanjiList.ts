import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';
import type { WordTestSubject } from '@typings/wordtest';

type SearchFormValues = {
  q: string;
  reading: string;
  subject: 'ALL' | WordTestSubject;
};

export const useKanjiList = () => {
  const { list, total, status } = useWordTestStore((s) => s.kanji);
  const fetchKanjiList = useWordTestStore((s) => s.fetchKanjiList);
  const deleteKanji = useWordTestStore((s) => s.deleteKanji);
  const deleteManyKanji = useWordTestStore((s) => s.deleteManyKanji);
  
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
      // 「ALL」は API のフィルタ未指定として扱う
      subject: data.subject === 'ALL' ? undefined : data.subject,
    });
  };

  const { confirm, ConfirmDialog } = useConfirm();

  const remove = async (id: string) => {
    if (await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      await deleteKanji(id);
      fetchKanjiList();
    }
  };

  const removeMany = async (ids: string[]) => {
    // 呼び出し側のバグ/二重クリックでも確認が出ないようにガードする
    if (ids.length === 0) return;
    if (await confirm(`選択した${ids.length}件を削除しますか？`, { variant: 'destructive' })) {
      await deleteManyKanji(ids);
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
    removeMany,
    ConfirmDialog,
  };
};
