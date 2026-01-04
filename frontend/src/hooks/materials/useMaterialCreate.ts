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
  const createMaterialSetWithUpload = useWordTestStore((s) => s.createMaterialSetWithUpload);
  const status = useWordTestStore((s) => s.material.status);

  const form = useForm<FormValues>();

  const submit = async (data: FormValues) => {
    const materialSet = await createMaterialSetWithUpload({
      request: {
        name: data.name,
        subject: data.subject,
        yearMonth: data.yearMonth,
        grade: data.grade,
        provider: data.provider,
        testType: data.testType,
        unit: data.unit,
      },
      questionFile: data.questionFile?.[0],
      answerFile: data.answerFile?.[0],
      gradedFile: data.gradedFile?.[0],
    });
    
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
