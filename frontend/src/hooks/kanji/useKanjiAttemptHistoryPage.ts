import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';

export const useKanjiAttemptHistoryPage = () => {
  const { id } = useParams<{ id: string }>();

  const { detail, status } = useWordTestStore((s) => s.kanji);
  const fetchKanji = useWordTestStore((s) => s.fetchKanji);

  useEffect(() => {
    if (id) void fetchKanji(id);
  }, [id, fetchKanji]);

  const headerSub = useMemo(() => {
    if (detail) return `${detail.kanji} / ${detail.reading ?? ''}`;
    return id ?? '';
  }, [detail, id]);

  return {
    id: id ?? null,
    kanji: detail,
    status,
    headerSub,
  };
};
