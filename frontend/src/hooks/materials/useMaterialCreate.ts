import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import type { CreateMaterialSetRequest } from '@smart-exam/api-types';

type FormValues = CreateMaterialSetRequest & {
  questionFile?: FileList;
  answerFile?: FileList;
  gradedFile?: FileList;
};

export const useMaterialCreate = () => {
  const navigate = useNavigate();
  const createMaterialSet = useWordTestStore((s) => s.createMaterialSet);
  const status = useWordTestStore((s) => s.material.status);

  const form = useForm<FormValues>();

  const submit = async (data: FormValues) => {
    const materialSet = await createMaterialSet({
      name: data.name,
      subject: data.subject,
      date: data.date,
      grade: data.grade,
      provider: data.provider,
      testType: data.testType,
      unit: data.unit,
      course: data.course,
      description: data.description,
    });
    
    // TODO: Handle file uploads here if needed
    
    if (materialSet) {
      navigate(`/materials/${materialSet.id}`);
    }
  };

  return {
    form,
    submit: form.handleSubmit(submit),
    isSubmitting: status.isLoading,
    error: status.error,
  };
};
