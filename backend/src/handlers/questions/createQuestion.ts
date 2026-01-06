import { QuestionRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { CreateQuestionParams, CreateQuestionRequest, CreateQuestionResponse } from '@smart-exam/api-types';

export const createQuestion: AsyncHandler<
  CreateQuestionParams,
  CreateQuestionResponse,
  CreateQuestionRequest,
  ParsedQs
> = async (req, res) => {
  const { materialId } = req.params;
  const item = await QuestionRepository.createQuestion({
    ...req.body,
    materialId: materialId,
  });
  res.status(201).json(item);
};
