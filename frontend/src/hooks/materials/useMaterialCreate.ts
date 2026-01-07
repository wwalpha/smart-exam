import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import type { CreateMaterialRequest } from '@smart-exam/api-types';

type FormValues = CreateMaterialRequest & {
  questionFile?: FileList;
  answerFile?: FileList;
  gradedFile?: FileList;
};

export const useMaterialCreate = () => {
  const navigate = useNavigate();
  const createMaterialWithUpload = useWordTestStore((s) => s.createMaterialWithUpload);
  const status = useWordTestStore((s) => s.material.status);

  const form = useForm<FormValues>();

  const submit = async (data: FormValues) => {
    const material = await createMaterialWithUpload({
      request: {
        name: data.name,
        subject: data.subject,
        materialDate: data.materialDate,
        registeredDate: data.registeredDate,
        grade: data.grade,
        provider: data.provider,
      },
      questionFile: data.questionFile?.[0],
      answerFile: data.answerFile?.[0],
      gradedFile: data.gradedFile?.[0],
    });

    if (material) {
      navigate(`/materials/${material.id}`);
    }
  };

  return {
    form,
    submit: form.handleSubmit(submit),
    isSubmitting: status.isLoading,
    error: status.error,
  };
};
