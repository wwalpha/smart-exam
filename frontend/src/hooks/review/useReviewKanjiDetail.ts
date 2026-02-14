import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';

const BASE_PATH = '/reviewtests/kanji';

export const useReviewKanjiDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { detail, status } = useWordTestStore((s) => s.review);
  const fetchExam = useWordTestStore((s) => s.fetchExam);
  const deleteExam = useWordTestStore((s) => s.deleteExam);
  const updateExamStatus = useWordTestStore((s) => s.updateExamStatus);
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    if (id) fetchExam(id, 'KANJI');
  }, [id, fetchExam]);

  const remove = async () => {
    if (detail && (await confirm('本当に削除しますか？', { variant: 'destructive' }))) {
      await deleteExam(detail.id, 'KANJI');
      navigate(BASE_PATH);
    }
  };

  return {
    id,
    review: detail,
    isLoading: status.isLoading,
    error: status.error,
    basePath: BASE_PATH,
    remove,
    updateExamStatus,
    ConfirmDialog,
  };
};
