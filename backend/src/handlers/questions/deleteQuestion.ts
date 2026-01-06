import { QuestionRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { DeleteQuestionParams, DeleteQuestionResponse } from '@smart-exam/api-types';

export const deleteQuestion: AsyncHandler<DeleteQuestionParams, DeleteQuestionResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const { questionId } = req.params;
  await QuestionRepository.deleteQuestion(questionId);
  res.status(204).end();
};
