import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';
import { compareQuestionNumber } from '@/utils/questionNumber';
import { normalizeQuestionNumber } from '@/utils/questionNumber';

type QuestionFormValues = {
  canonicalKey: string;
};

export const useQuestionManagement = () => {
  const { id } = useParams<{ id: string }>();
  const { questions, detail, files, status } = useWordTestStore((s) => s.material);
  const fetchQuestions = useWordTestStore((s) => s.fetchQuestions);
  const fetchMaterial = useWordTestStore((s) => s.fetchMaterial);
  const fetchMaterialFiles = useWordTestStore((s) => s.fetchMaterialFiles);
  const createQuestion = useWordTestStore((s) => s.createQuestion);
  const createQuestionsBulk = useWordTestStore((s) => s.createQuestionsBulk);
  const deleteQuestion = useWordTestStore((s) => s.deleteQuestion);
  const markQuestionCorrect = useWordTestStore((s) => s.markQuestionCorrect);
  const markQuestionIncorrect = useWordTestStore((s) => s.markQuestionIncorrect);
  const extractQuestionsFromGradedAnswer = useWordTestStore((s) => s.extractQuestionsFromGradedAnswer);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [busyQuestionId, setBusyQuestionId] = useState<string | null>(null);
  const [optimisticResultByQuestionId, setOptimisticResultByQuestionId] = useState<
    Record<string, 'correct' | 'incorrect' | undefined>
  >({});
  const form = useForm<QuestionFormValues>();
  const { reset } = form;
  const { confirm, ConfirmDialog } = useConfirm();

  const extractedRef = useRef(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => compareQuestionNumber(a.canonicalKey, b.canonicalKey));
  }, [questions]);

  useEffect(() => {
    // 画面の対象IDが変わったら、関連データをまとめて再取得する
    if (id) {
      extractedRef.current = false;
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

  useEffect(() => {
    // 参照中の教材と一致している場合のみ自動抽出を許可する
    if (!id || !detail || detail.id !== id) return;
    // useEffectの再実行（StrictMode含む）でも二重抽出しない
    if (extractedRef.current) return;
    // 既に問題が登録済みなら自動抽出しない
    if (questions.length > 0) return;
    // 採点済み解答PDFがある場合のみ抽出対象とする
    if (!files.some((f) => f.fileType === 'GRADED_ANSWER')) return;

    extractedRef.current = true;
    extractQuestionsFromGradedAnswer(id);
  }, [id, detail, files, questions.length, extractQuestionsFromGradedAnswer]);

  const submit = async (data: QuestionFormValues) => {
    // URLが不正/教材未取得の状態で送信される可能性をガードする
    if (!id || !detail) return;
    await createQuestion(id, {
      ...data,
      subject: detail.subject,
    });
    reset();
    setIsDialogOpen(false);
  };

  const submitBulk = async () => {
    // URLが不正/教材未取得の状態で送信される可能性をガードする
    if (!id || !detail) return;

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
    if (await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      if (!id) return;
      await deleteQuestion(id, questionId);
      if (id) fetchQuestions(id);
    }
  };

  const markCorrect = async (questionId: string) => {
    // 二重クリック等で同時に複数更新しない（UX・整合性のため）
    if (busyQuestionId) return;
    setBusyQuestionId(questionId);
    setOptimisticResultByQuestionId((prev) => ({ ...prev, [questionId]: 'correct' }));
    try {
      if (!id) return;
      await markQuestionCorrect(id, questionId);
      if (id) fetchQuestions(id);
    } finally {
      // API失敗時もボタン操作を復帰させる
      setBusyQuestionId(null);
    }
  };

  const markIncorrect = async (questionId: string) => {
    // 二重クリック等で同時に複数更新しない（UX・整合性のため）
    if (busyQuestionId) return;
    setBusyQuestionId(questionId);
    setOptimisticResultByQuestionId((prev) => ({ ...prev, [questionId]: 'incorrect' }));
    try {
      if (!id) return;
      await markQuestionIncorrect(id, questionId);
      if (id) fetchQuestions(id);
    } finally {
      // API失敗時もボタン操作を復帰させる
      setBusyQuestionId(null);
    }
  };

  return {
    id,
    material: detail,
    questions: sortedQuestions,
    isInitialLoading: status.isLoading && !hasLoadedOnce,
    isBusy: status.isLoading,
    busyQuestionId,
    error: status.error,
    isDialogOpen,
    setIsDialogOpen,
    isBulkDialogOpen,
    setIsBulkDialogOpen,
    bulkInput,
    setBulkInput,
    optimisticResultByQuestionId,
    form,
    submit: form.handleSubmit(submit),
    submitBulk,
    remove,
    markCorrect,
    markIncorrect,
    ConfirmDialog,
  };
};
