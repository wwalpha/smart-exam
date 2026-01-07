import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';

export const useReviewDetail = (params: { basePath: string }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const basePath = params.basePath;

  const { detail, status } = useWordTestStore((s) => s.review);
  const fetchReviewTest = useWordTestStore((s) => s.fetchReviewTest);
  const deleteReviewTest = useWordTestStore((s) => s.deleteReviewTest);
  const updateReviewTestStatus = useWordTestStore((s) => s.updateReviewTestStatus);
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    if (id) {
      fetchReviewTest(id);
    }
  }, [id, fetchReviewTest]);

  const remove = async () => {
    if (detail && await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      await deleteReviewTest(detail.id);
      navigate(basePath);
    }
  };

  return {
    id,
    review: detail,
    isLoading: status.isLoading,
    error: status.error,
    basePath,
    remove,
    updateReviewTestStatus,
    ConfirmDialog,
  };
};
