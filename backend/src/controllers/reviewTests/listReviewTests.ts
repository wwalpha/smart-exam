import { ReviewTestRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { ReviewTestListResponse } from '@smart-exam/api-types';
import { logger } from '@/lib/logger';
import { ENV } from '@/lib/env';
import { ApiError } from '@/lib/apiError';

export const listReviewTests: AsyncHandler<{}, ReviewTestListResponse, {}, ParsedQs> = async (_req, res) => {
  try {
    const items = await ReviewTestRepository.listReviewTests();
    res.json({ items, total: items.length });
  } catch (e) {
    // CloudWatchでの原因追跡を容易にするため、テーブル名などの文脈を付けてログを出す
    logger.error(`[review-tests] listReviewTests failed table=${ENV.TABLE_REVIEW_TESTS} region=${ENV.AWS_REGION}`, e);
    throw new ApiError('failed to list review tests', 500, ['internal_server_error'], ['review_tests_list_failed']);
  }
};
