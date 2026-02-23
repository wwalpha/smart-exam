import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useWordTestStore } from '@/stores';
import type { CreateMaterialRequest } from '@smart-exam/api-types';

type FormValues = CreateMaterialRequest;

export const useMaterialCreate = () => {
  const navigate = useNavigate();
  const createMaterial = useWordTestStore((s) => s.createMaterial);
  const status = useWordTestStore((s) => s.material.status);

  const form = useForm<FormValues>({
    defaultValues: {
      subject: [],
    },
  });

  const submit = async (data: FormValues) => {
    const response = await createMaterial({
      name: data.name,
      subject: data.subject,
      materialDate: data.materialDate,
      registeredDate: data.registeredDate,
      grade: data.grade,
      provider: data.provider,
    });

    if (response.items.length > 0) {
      navigate('/materials');
    }
  };

  return {
    form,
    submit: form.handleSubmit(submit),
    isSubmitting: status.isLoading,
    error: status.error,
  };
};
