import { QuestionRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { SearchQuestionsRequest, SearchQuestionsResponse } from '@smart-exam/api-types';

export const searchQuestions: AsyncHandler<{}, SearchQuestionsResponse, SearchQuestionsRequest, ParsedQs> = async (
  req,
  res
) => {
  const { keyword, subject } = req.body ?? {};
  const items = await QuestionRepository.searchQuestions({
    keyword,
    subject,
  });
  res.json({ datas: items });
};
