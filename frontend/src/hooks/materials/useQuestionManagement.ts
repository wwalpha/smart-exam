import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';
import { compareQuestionNumber } from '@/utils/questionNumber';
import { normalizeQuestionNumber } from '@/utils/questionNumber';

export const useQuestionManagement = () => {
  const { id } = useParams<{ id: string }>();
  const { questions, detail, files, status } = useWordTestStore((s) => s.material);
  const fetchQuestions = useWordTestStore((s) => s.fetchQuestions);
  const fetchMaterial = useWordTestStore((s) => s.fetchMaterial);
  const fetchMaterialFiles = useWordTestStore((s) => s.fetchMaterialFiles);
  const createQuestionsBulk = useWordTestStore((s) => s.createQuestionsBulk);
  const deleteQuestion = useWordTestStore((s) => s.deleteQuestion);
  const setQuestionChoice = useWordTestStore((s) => s.setQuestionChoice);
  const extractQuestionsFromGradedAnswer = useWordTestStore((s) => s.extractQuestionsFromGradedAnswer);

  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [busyQuestionId, setBusyQuestionId] = useState<string | null>(null);
  const [optimisticResultByQuestionId, setOptimisticResultByQuestionId] = useState<
    Record<string, 'correct' | 'incorrect' | undefined>
  >({});
  const { confirm, ConfirmDialog } = useConfirm();

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => compareQuestionNumber(a.canonicalKey, b.canonicalKey));
  }, [questions]);

  const hasGradedAnswerPdf = useMemo(() => {
    return files.some((file) => file.fileType === 'GRADED_ANSWER' && file.filename.toLowerCase().endsWith('.pdf'));
  }, [files]);

  useEffect(() => {
    // 画面の対象IDが変わったら、関連データをまとめて再取得する
    if (id) {
      fetchMaterial(id);
      fetchMaterialFiles(id);
      fetchQuestions(id);
    }
  }, [id, fetchMaterial, fetchMaterialFiles, fetchQuestions]);

  useEffect(() => {
    // 初回ロード完了判定（ミューテーション中に全画面Loadingへ戻さないため）
    if (detail && id && detail.id === id) {
      setHasLoadedOnce(true);
    }
  }, [detail, id]);

  const submitBulk = async () => {
    // URLが不正/教材未取得の状態で送信される可能性をガードする
    if (!id || !detail) return;
    if (detail.isCompleted) return;

    const normalized = bulkInput
      .split(/[\s,]+/)
      .map((s) => normalizeQuestionNumber(s))
      .filter((s): s is string => typeof s === 'string');

    const unique = Array.from(new Set(normalized)).sort(compareQuestionNumber);
    // 入力が空（または無効な値のみ）の場合は何もしない
    if (unique.length === 0) return;

    await createQuestionsBulk(
      id,
      unique.map((canonicalKey) => ({ canonicalKey, subject: detail.subject })),
    );

    setBulkInput('');
    setIsBulkDialogOpen(false);
  };

  const remove = async (questionId: string) => {
    if (detail?.isCompleted) return;
    if (await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      if (!id) return;
      await deleteQuestion(id, questionId);
      if (id) fetchQuestions(id);
    }
  };

  const markCorrect = async (questionId: string) => {
    if (detail?.isCompleted) return;
    // 二重クリック等で同時に複数更新しない（UX・整合性のため）
    if (busyQuestionId) return;
    setBusyQuestionId(questionId);
    setOptimisticResultByQuestionId((prev) => ({ ...prev, [questionId]: 'correct' }));
    try {
      if (!id) return;
      await setQuestionChoice(id, questionId, true);
      if (id) fetchQuestions(id);
    } finally {
      // API失敗時もボタン操作を復帰させる
      setBusyQuestionId(null);
    }
  };

  const markIncorrect = async (questionId: string) => {
    if (detail?.isCompleted) return;
    // 二重クリック等で同時に複数更新しない（UX・整合性のため）
    if (busyQuestionId) return;
    setBusyQuestionId(questionId);
    setOptimisticResultByQuestionId((prev) => ({ ...prev, [questionId]: 'incorrect' }));
    try {
      if (!id) return;
      await setQuestionChoice(id, questionId, false);
      if (id) fetchQuestions(id);
    } finally {
      // API失敗時もボタン操作を復帰させる
      setBusyQuestionId(null);
    }
  };

  const analyze = async () => {
    if (!id || !detail) return;
    if (detail.isCompleted) return;
    if (!hasGradedAnswerPdf) return;
    await extractQuestionsFromGradedAnswer(id);
  };

  return {
    id,
    material: detail,
    questions: sortedQuestions,
    isInitialLoading: status.isLoading && !hasLoadedOnce,
    isBusy: status.isLoading,
    busyQuestionId,
    error: status.error,
    isBulkDialogOpen,
    setIsBulkDialogOpen,
    bulkInput,
    setBulkInput,
    optimisticResultByQuestionId,
    submitBulk,
    remove,
    markCorrect,
    markIncorrect,
    analyze,
    canAnalyze: !status.isLoading && !!detail && !detail.isCompleted && hasGradedAnswerPdf,
    ConfirmDialog,
  };
};
