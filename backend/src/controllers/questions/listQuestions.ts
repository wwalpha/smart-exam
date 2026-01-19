import { QuestionRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { ListQuestionsParams, QuestionListResponse } from '@smart-exam/api-types';

export const listQuestions: AsyncHandler<ListQuestionsParams, QuestionListResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const { materialId } = req.params;
  const items = await QuestionRepository.listQuestions(materialId);
  res.json({ datas: items });
};
