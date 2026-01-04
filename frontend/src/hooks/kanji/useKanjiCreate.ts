import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useWordTestStore } from '@/stores';

type FormValues = {
  kanji: string;
  reading: string;
  meaning: string;
  subject: string;
};

export const useKanjiCreate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const createKanji = useWordTestStore((s) => s.createKanji);
  const updateKanji = useWordTestStore((s) => s.updateKanji);
  const fetchKanji = useWordTestStore((s) => s.fetchKanji);
  const { detail, status } = useWordTestStore((s) => s.kanji);

  const form = useForm<FormValues>();
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
        meaning: detail.meaning || '',
        subject: detail.subject || '国語',
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
    form,
    submit: form.handleSubmit(submit),
    isSubmitting: status.isLoading,
    error: status.error,
  };
};
