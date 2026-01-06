import { QuestionRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { UpdateQuestionParams, UpdateQuestionRequest, UpdateQuestionResponse } from '@smart-exam/api-types';

export const updateQuestion: AsyncHandler<
  UpdateQuestionParams,
  UpdateQuestionResponse | { error: string },
  UpdateQuestionRequest,
  ParsedQs
> = async (req, res) => {
  const { questionId } = req.params;
  const item = await QuestionRepository.updateQuestion(questionId, req.body);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};
