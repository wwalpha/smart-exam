import { QuestionRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { SearchQuestionsRequest, SearchQuestionsResponse } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';

import { SubjectIdSchema } from '@/lib/zodSchemas';

export const SearchQuestionsBodySchema = z.object({
  keyword: z.string().optional(),
  subject: SubjectIdSchema.optional(),
});

export const searchQuestions: AsyncHandler<{}, SearchQuestionsResponse, SearchQuestionsRequest, ParsedQs> = async (
  req,
  res
) => {
  const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchQuestionsBodySchema>;
  const { keyword, subject } = body ?? {};
  const items = await QuestionRepository.searchQuestions({
    keyword,
    subject,
  });
  res.json({ datas: items });
};
