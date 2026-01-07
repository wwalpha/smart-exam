import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';

const BASE_PATH = '/reviewtests/questions';

export const useReviewQuestionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { detail, status } = useWordTestStore((s) => s.review);
  const fetchReviewTest = useWordTestStore((s) => s.fetchReviewTest);
  const deleteReviewTest = useWordTestStore((s) => s.deleteReviewTest);
  const updateReviewTestStatus = useWordTestStore((s) => s.updateReviewTestStatus);
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    if (id) fetchReviewTest(id);
  }, [id, fetchReviewTest]);

  const remove = async () => {
    if (detail && (await confirm('本当に削除しますか？', { variant: 'destructive' }))) {
      await deleteReviewTest(detail.id);
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
    updateReviewTestStatus,
    ConfirmDialog,
  };
};
