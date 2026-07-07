import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';
import { compareQuestionNumber } from '@/utils/questionNumber';
import { parseQuestionBulkInput } from '@/utils/questionBulkInput';

type DraftChoice = {
  choice: 'CORRECT' | 'INCORRECT';
  correctAnswer: string;
};

const buildDraftFromQuestions = (
  questions: Array<{ id: string; choice?: 'CORRECT' | 'INCORRECT'; correctAnswer?: string }>,
) => {
  const draft: Record<string, DraftChoice> = {};
  for (const question of questions) {
    draft[question.id] = {
      choice: question.choice ?? 'CORRECT',
      correctAnswer: String(question.correctAnswer ?? ''),
    };
  }
  return draft;
};

export const useQuestionManagement = () => {
  const { id } = useParams<{ id: string }>();
  const { questions, detail, status } = useWordTestStore((s) => s.material);
  const fetchQuestions = useWordTestStore((s) => s.fetchQuestions);
  const fetchMaterial = useWordTestStore((s) => s.fetchMaterial);
  const createQuestionsBulk = useWordTestStore((s) => s.createQuestionsBulk);
  const deleteQuestion = useWordTestStore((s) => s.deleteQuestion);
  const setQuestionChoices = useWordTestStore((s) => s.setQuestionChoices);
  const extractQuestionsFromGradedAnswer = useWordTestStore((s) => s.extractQuestionsFromGradedAnswer);

  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkValidationError, setBulkValidationError] = useState<string | null>(null);
  const [draftByQuestionId, setDraftByQuestionId] = useState<Record<string, DraftChoice>>({});
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(() => new Set());
  const { confirm, ConfirmDialog } = useConfirm();

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => compareQuestionNumber(a.canonicalKey, b.canonicalKey));
  }, [questions]);

  const hasUnsavedChanges = useMemo(() => {
    for (const question of sortedQuestions) {
      const draft = draftByQuestionId[question.id];
      if (!draft) return false;

      const currentChoice = question.choice ?? 'CORRECT';
      const currentAnswer = String(question.correctAnswer ?? '');
      if (draft.choice !== currentChoice) return true;
      if (draft.correctAnswer !== currentAnswer) return true;
    }
    return false;
  }, [draftByQuestionId, sortedQuestions]);

  const validationErrorByQuestionId = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const question of sortedQuestions) {
      const draft = draftByQuestionId[question.id] ?? {
        choice: question.choice ?? 'CORRECT',
        correctAnswer: String(question.correctAnswer ?? ''),
      };
      if (draft.choice === 'INCORRECT' && draft.correctAnswer.trim().length === 0) {
        errors[question.id] = '不正解の場合は正解値を入力してください';
      }
    }
    return errors;
  }, [draftByQuestionId, sortedQuestions]);

  const hasValidationErrors = useMemo(() => {
    return Object.keys(validationErrorByQuestionId).length > 0;
  }, [validationErrorByQuestionId]);

  const isAllQuestionsSelected = useMemo(() => {
    return sortedQuestions.length > 0 && sortedQuestions.every((question) => selectedQuestionIds.has(question.id));
  }, [selectedQuestionIds, sortedQuestions]);

  const isSomeQuestionsSelected = useMemo(() => {
    const selectedVisibleQuestionCount = sortedQuestions.filter((question) => selectedQuestionIds.has(question.id)).length;
    return selectedVisibleQuestionCount > 0 && selectedVisibleQuestionCount < sortedQuestions.length;
  }, [selectedQuestionIds, sortedQuestions]);

  useEffect(() => {
    // 画面の対象IDが変わったら、関連データをまとめて再取得する
    if (id) {
      fetchMaterial(id);
      fetchQuestions(id);
    }
  }, [id, fetchMaterial, fetchQuestions]);

  useEffect(() => {
    // 初回ロード完了判定（ミューテーション中に全画面Loadingへ戻さないため）
    if (detail && id && detail.id === id) {
      setHasLoadedOnce(true);
    }
  }, [detail, id]);

  useEffect(() => {
    setDraftByQuestionId(buildDraftFromQuestions(sortedQuestions));
  }, [sortedQuestions]);

  useEffect(() => {
    const visibleQuestionIds = new Set(sortedQuestions.map((question) => question.id));
    setSelectedQuestionIds((prev) => {
      const next = new Set(Array.from(prev).filter((questionId) => visibleQuestionIds.has(questionId)));
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [sortedQuestions]);

  const submitBulk = async () => {
    // URLが不正/教材未取得の状態で送信される可能性をガードする
    if (!id || !detail) return;
    if (detail.isCompleted) return;

    const parsed = parseQuestionBulkInput(bulkInput);
    if (!parsed.ok) {
      setBulkValidationError(parsed.error);
      return;
    }

    // 入力が空（または無効な値のみ）の場合は何もしない
    if (parsed.items.length === 0) return;

    await createQuestionsBulk(
      id,
      parsed.items.map((item) => ({
        canonicalKey: item.canonicalKey,
        subject: detail.subject,
        correctAnswer: item.correctAnswer,
      })),
    );

    setBulkInput('');
    setBulkValidationError(null);
    setIsBulkDialogOpen(false);
  };

  const updateBulkInput = (value: string) => {
    setBulkInput(value);
    if (bulkValidationError) {
      setBulkValidationError(null);
    }
  };

  const remove = async (questionId: string) => {
    if (detail?.isCompleted) return;
    if (await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      if (!id) return;
      await deleteQuestion(id, questionId);
      setSelectedQuestionIds((prev) => {
        if (!prev.has(questionId)) return prev;
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
      if (id) fetchQuestions(id);
    }
  };

  const toggleQuestionSelection = (questionId: string, selected?: boolean) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      const shouldSelect = selected ?? !next.has(questionId);
      if (shouldSelect) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  };

  const clearQuestionSelection = () => {
    setSelectedQuestionIds(new Set());
  };

  const toggleSelectAllQuestions = () => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      const visibleQuestionIds = sortedQuestions.map((question) => question.id);
      const shouldClear = visibleQuestionIds.length > 0 && visibleQuestionIds.every((questionId) => next.has(questionId));
      if (shouldClear) {
        for (const questionId of visibleQuestionIds) next.delete(questionId);
        return next;
      }
      for (const questionId of visibleQuestionIds) next.add(questionId);
      return next;
    });
  };

  const removeSelected = async () => {
    if (!id || detail?.isCompleted || sortedQuestions.length === 0 || selectedQuestionIds.size === 0) return;
    const questionIds = sortedQuestions
      .map((question) => question.id)
      .filter((questionId) => selectedQuestionIds.has(questionId));
    if (questionIds.length === 0) return;

    if (await confirm(`選択した ${questionIds.length} 件の問題を削除しますか？`, { variant: 'destructive' })) {
      for (const questionId of questionIds) {
        await deleteQuestion(id, questionId);
      }
      clearQuestionSelection();
      await fetchQuestions(id);
    }
  };

  const setChoice = (questionId: string, isCorrect: boolean) => {
    if (detail?.isCompleted) return;
    setDraftByQuestionId((prev) => {
      const current = prev[questionId] ?? { choice: 'CORRECT', correctAnswer: '' };
      return {
        ...prev,
        [questionId]: {
          choice: isCorrect ? 'CORRECT' : 'INCORRECT',
          correctAnswer: current.correctAnswer,
        },
      };
    });
  };

  const setCorrectAnswer = (questionId: string, value: string) => {
    if (detail?.isCompleted) return;
    setDraftByQuestionId((prev) => {
      const current = prev[questionId] ?? { choice: 'CORRECT', correctAnswer: '' };
      return {
        ...prev,
        [questionId]: {
          ...current,
          correctAnswer: value,
        },
      };
    });
  };

  const saveChoices = async () => {
    if (!id || !detail || detail.isCompleted) return;
    if (hasValidationErrors) return;

    const items = sortedQuestions.map((question) => {
      const draft = draftByQuestionId[question.id] ?? {
        choice: question.choice ?? 'CORRECT',
        correctAnswer: String(question.correctAnswer ?? ''),
      };
      const isCorrect = draft.choice !== 'INCORRECT';
      return {
        questionId: question.id,
        isCorrect,
        correctAnswer: isCorrect ? undefined : draft.correctAnswer,
      };
    });

    await setQuestionChoices(id, items);
    await fetchQuestions(id);
  };

  const analyze = async () => {
    if (!id || !detail) return;
    if (detail.isCompleted) return;
    await extractQuestionsFromGradedAnswer(id);
  };

  return {
    id,
    material: detail,
    questions: sortedQuestions,
    isInitialLoading: status.isLoading && !hasLoadedOnce,
    isBusy: status.isLoading,
    error: status.error,
    isBulkDialogOpen,
    setIsBulkDialogOpen,
    bulkInput,
    setBulkInput: updateBulkInput,
    bulkValidationError,
    submitBulk,
    remove,
    selectedQuestionIds,
    toggleQuestionSelection,
    toggleSelectAllQuestions,
    clearQuestionSelection,
    removeSelected,
    isAllQuestionsSelected,
    isSomeQuestionsSelected,
    setChoice,
    setCorrectAnswer,
    saveChoices,
    draftByQuestionId,
    hasUnsavedChanges,
    validationErrorByQuestionId,
    hasValidationErrors,
    analyze,
    canAnalyze: !status.isLoading && !!detail && !detail.isCompleted,
    ConfirmDialog,
  };
};
