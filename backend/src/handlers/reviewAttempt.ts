import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { ParamsDictionary } from 'express-serve-static-core';
import type {
  ListReviewAttemptsResponse,
  UpsertReviewAttemptRequest,
  UpsertReviewAttemptResponse,
} from '@smart-exam/api-types';
import { ReviewAttemptsRepository } from '@/repositories/reviewAttemptRepository';

type ListReviewAttemptsQuery = {
  targetType?: 'QUESTION' | 'KANJI';
  targetId?: string;
};

export const listReviewAttempts: AsyncHandler<ParamsDictionary, ListReviewAttemptsResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const q = req.query as unknown as ListReviewAttemptsQuery;
  if (!q.targetType || !q.targetId) {
    res.status(400).json({ items: [] });
    return;
  }

  const items = await ReviewAttemptsRepository.listByTarget({ targetType: q.targetType, targetId: q.targetId });
  res.json({ items });
};

export const upsertReviewAttempt: AsyncHandler<
  ParamsDictionary,
  UpsertReviewAttemptResponse,
  UpsertReviewAttemptRequest,
  ParsedQs
> = async (req, res) => {
  const item = await ReviewAttemptsRepository.upsert(req.body);
  res.json(item);
};
