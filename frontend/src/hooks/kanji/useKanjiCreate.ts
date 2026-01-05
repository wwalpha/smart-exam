import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import { SUBJECT } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

type FormValues = {
  kanji: string;
  reading: string;
  subject: WordTestSubject;
};

export const useKanjiCreate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const createKanji = useWordTestStore((s) => s.createKanji);
  const updateKanji = useWordTestStore((s) => s.updateKanji);
  const fetchKanji = useWordTestStore((s) => s.fetchKanji);
  const { detail, status } = useWordTestStore((s) => s.kanji);

  const form = useForm<FormValues>({
    defaultValues: {
      kanji: '',
      reading: '',
      subject: SUBJECT.japanese,
    },
  });
  const { reset } = form;

  const isEdit = !!id;

  useEffect(() => {
    if (isEdit && id) {
      fetchKanji(id);
    }
  }, [isEdit, id, fetchKanji]);

  useEffect(() => {
    if (isEdit && detail) {
      reset({
        kanji: detail.kanji,
        reading: detail.reading || '',
        subject: detail.subject || SUBJECT.japanese,
      });
    }
  }, [isEdit, detail, reset]);

  const submit = async (data: FormValues) => {
    if (isEdit && id) {
      await updateKanji(id, data);
    } else {
      await createKanji(data);
    }
    navigate('/kanji');
  };

  return {
    isEdit,
    kanjiId: id ?? null,
    detail,
    form,
    submit: form.handleSubmit(submit),
    isSubmitting: status.isLoading,
    error: status.error,
  };
};
