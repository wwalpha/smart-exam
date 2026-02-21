// Module: listExamAttemptsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedQuery } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { ListExamAttemptsResponse, ExamTargetType, SubjectId } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { ListExamAttemptsQuerySchema } from './listExamAttempts.schema';

/** Creates list exam attempts controller. */
export const listExamAttemptsController = (services: Services) => {
  const listExamAttempts: AsyncHandler<
    ParamsDictionary,
    ListExamAttemptsResponse,
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const q = (req.validated?.query ?? req.query) as ValidatedQuery<typeof ListExamAttemptsQuerySchema>;

    const items = await services.examAttempts.listExamAttempts({
      targetType: q.targetType as ExamTargetType,
      targetId: q.targetId,
      subject: q.subject as SubjectId | undefined,
    });

    res.json({ items });
  };

  return {
    ListExamAttemptsQuerySchema,
    listExamAttempts,
  };
};

// 互換用エイリアス
export const listReviewAttemptsController = listExamAttemptsController;
