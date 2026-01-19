import { QuestionRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { UpdateQuestionParams, UpdateQuestionRequest, UpdateQuestionResponse } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';
import { SubjectIdSchema } from '@/lib/zodSchemas';

export const UpdateQuestionBodySchema = z.object({
  canonicalKey: z.string().min(1).optional(),
  subject: SubjectIdSchema.optional(),
  tags: z.array(z.string().min(1)).optional(),
});

export const updateQuestion: AsyncHandler<
  UpdateQuestionParams,
  UpdateQuestionResponse | { error: string },
  UpdateQuestionRequest,
  ParsedQs
> = async (req, res) => {
  const { questionId } = req.params;
  const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof UpdateQuestionBodySchema>;
  const item = await QuestionRepository.updateQuestion(questionId, body);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};
