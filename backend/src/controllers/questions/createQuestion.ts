import { QuestionRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { CreateQuestionParams, CreateQuestionRequest, CreateQuestionResponse } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';
import { SubjectIdSchema } from '@/lib/zodSchemas';

export const CreateQuestionBodySchema = z.object({
  canonicalKey: z.string().min(1),
  subject: SubjectIdSchema,
  tags: z.array(z.string().min(1)).optional(),
});

export const createQuestion: AsyncHandler<
  CreateQuestionParams,
  CreateQuestionResponse,
  CreateQuestionRequest,
  ParsedQs
> = async (req, res) => {
  const { materialId } = req.params;
  const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateQuestionBodySchema>;
  const item = await QuestionRepository.createQuestion({
    ...body,
    materialId: materialId,
  });
  res.status(201).json(item);
};
