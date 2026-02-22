import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';

const BASE_PATH = '/exam/kanji';

export const useReviewKanjiDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { detail, status } = useWordTestStore((s) => s.review);
  const fetchExam = useWordTestStore((s) => s.fetchExam);
  const deleteExam = useWordTestStore((s) => s.deleteExam);
  const completeExam = useWordTestStore((s) => s.completeExam);
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    if (id) fetchExam(id);
  }, [id, fetchExam]);

  const remove = async () => {
    if (detail && (await confirm('本当に削除しますか？', { variant: 'destructive' }))) {
      await deleteExam(detail.examId);
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
    completeExam,
    ConfirmDialog,
  };
};
