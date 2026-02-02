import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedQuery } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { z } from 'zod';

import { REVIEW_MODE } from '@smart-exam/api-types';
import type { ListReviewAttemptsResponse, ReviewTargetType, SubjectId } from '@smart-exam/api-types';

import { SubjectIdSchema } from '@/lib/zodSchemas';
import type { Services } from '@/services/createServices';

const ReviewModeSchema = z.enum([REVIEW_MODE.QUESTION, REVIEW_MODE.KANJI]);

const queryString = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string());
const queryStringOptional = () => z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

export const createReviewAttemptsController = (services: Services) => {
  const ListReviewAttemptsQuerySchema = z.object({
    targetType: queryString().pipe(ReviewModeSchema),
    targetId: queryString().pipe(z.string().min(1)),
    subject: queryStringOptional().pipe(SubjectIdSchema.optional()),
  });

  const listReviewAttempts: AsyncHandler<
    ParamsDictionary,
    ListReviewAttemptsResponse,
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const q = (req.validated?.query ?? req.query) as ValidatedQuery<typeof ListReviewAttemptsQuerySchema>;

    const items = await services.reviewAttempts.listReviewAttempts({
      targetType: q.targetType as ReviewTargetType,
      targetId: q.targetId,
      subject: q.subject as SubjectId | undefined,
    });

    res.json({ items });
  };

  return {
    ListReviewAttemptsQuerySchema,
    listReviewAttempts,
  };
};
