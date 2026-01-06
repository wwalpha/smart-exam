import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { useConfirm } from '@/components/common/useConfirm';
import { compareQuestionNumber } from '@/utils/questionNumber';

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
  const form = useForm<QuestionFormValues>();
  const { reset } = form;
  const { confirm, ConfirmDialog } = useConfirm();

  const extractedRef = useRef(false);

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => compareQuestionNumber(a.canonicalKey, b.canonicalKey));
  }, [questions]);

  useEffect(() => {
    if (id) {
      extractedRef.current = false;
      fetchMaterial(id);
      fetchMaterialFiles(id);
      fetchQuestions(id);
    }
  }, [id, fetchMaterial, fetchMaterialFiles, fetchQuestions]);

  useEffect(() => {
    if (!id || !detail || detail.id !== id) return;
    if (extractedRef.current) return;
    if (questions.length > 0) return;
    if (!files.some((f) => f.fileType === 'GRADED_ANSWER')) return;

    extractedRef.current = true;
    extractQuestionsFromGradedAnswer(id);
  }, [id, detail, files, questions.length, extractQuestionsFromGradedAnswer]);

  const submit = async (data: QuestionFormValues) => {
    if (!id || !detail) return;
    await createQuestion(id, {
      ...data,
      subject: detail.subject,
    });
    reset();
    setIsDialogOpen(false);
  };

  const submitBulk = async () => {
    if (!id || !detail) return;

    const normalized = bulkInput
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => s.replace(/[^0-9\-]/g, ''))
      .filter((s) => /^\d+(?:-\d+)*$/.test(s));

    const unique = Array.from(new Set(normalized)).sort(compareQuestionNumber);
    if (unique.length === 0) return;

    await createQuestionsBulk(
      id,
      unique.map((canonicalKey) => ({ canonicalKey, subject: detail.subject }))
    );

    setBulkInput('');
    setIsBulkDialogOpen(false);
  };

  const remove = async (questionId: string) => {
    if (await confirm('本当に削除しますか？', { variant: 'destructive' })) {
      await deleteQuestion(questionId);
      if (id) fetchQuestions(id);
    }
  };

  const markCorrect = async (questionId: string) => {
    await markQuestionCorrect(questionId);
  };

  const markIncorrect = async (questionId: string) => {
    await markQuestionIncorrect(questionId);
  };

  return {
    id,
    material: detail,
    questions: sortedQuestions,
    isInitialLoading: status.isLoading && !detail,
    isBusy: status.isLoading,
    error: status.error,
    isDialogOpen,
    setIsDialogOpen,
    isBulkDialogOpen,
    setIsBulkDialogOpen,
    bulkInput,
    setBulkInput,
    form,
    submit: form.handleSubmit(submit),
    submitBulk,
    remove,
    markCorrect,
    markIncorrect,
    ConfirmDialog,
  };
};
