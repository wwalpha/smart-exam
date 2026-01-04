import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';

export const useWordTestDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const lists = useWordTestStore((s) => s.wordtest.lists);
  const details = useWordTestStore((s) => s.wordtest.details);
  const fetchWordTests = useWordTestStore((s) => s.fetchWordTests);
  const fetchWordTest = useWordTestStore((s) => s.fetchWordTest);
  const status = useWordTestStore((s) => s.wordtest.status);
  const hasRequestedRef = useRef(false);
  const hasRequestedListsRef = useRef(false);

  const summary = id ? lists.find((x) => x.id === id) : undefined;
  const detail = id ? details[id] : undefined;

  useEffect(() => {
    if (!id) return;
    if (summary) return;
    if (hasRequestedListsRef.current) return;
    hasRequestedListsRef.current = true;
    void fetchWordTests();
  }, [fetchWordTests, summary, id]);

  useEffect(() => {
    if (!id) return;
    if (id in details) return;
    if (hasRequestedRef.current) return;
    hasRequestedRef.current = true;
    void fetchWordTest(id);
  }, [details, fetchWordTest, id]);

  const onPrintClick = () => {
    window.print();
  };

  return {
    test: summary ? { ...summary, ...detail } : undefined,
    questions: detail?.items || [],
    onPrintClick,
    isLoading: status.isLoading,
    error: status.error,
  };
}
