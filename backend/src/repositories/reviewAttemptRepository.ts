import { dbHelper } from '@/lib/aws';
import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import type { ReviewAttemptTable } from '@/types/db';
import type {
  SubjectId,
  ReviewAttempt,
  UpsertReviewAttemptRequest,
  DeleteReviewAttemptRequest,
} from '@smart-exam/api-types';

const TABLE_REVIEW_ATTEMPTS = ENV.TABLE_REVIEW_ATTEMPTS;

const targetKeyOf = (targetType: 'QUESTION' | 'KANJI', targetId: string): string => `${targetType}#${targetId}`;

const toIsoAtStartOfDay = (ymd: string): string => {
  return DateUtils.format(`${ymd}T00:00:00`);
};

const toApiAttempt = (row: ReviewAttemptTable): ReviewAttempt => {
  const dateYmd = DateUtils.toYmd(row.attemptedAt);
  return {
    targetType: row.targetType,
    targetId: row.targetId,
    subject: row.subject as SubjectId,
    dateYmd,
    attemptedAt: row.attemptedAt,
    isCorrect: row.state === 'CORRECT',
    memo: row.memo,
    reviewTestId: row.reviewTestId,
  };
};

export const ReviewAttemptsRepository = {
  listByTarget: async (params: { targetType: 'QUESTION' | 'KANJI'; targetId: string }): Promise<ReviewAttempt[]> => {
    const targetKey = targetKeyOf(params.targetType, params.targetId);
    const result = await dbHelper.query<ReviewAttemptTable>({
      TableName: TABLE_REVIEW_ATTEMPTS,
      KeyConditionExpression: '#targetKey = :targetKey',
      ExpressionAttributeNames: { '#targetKey': 'targetKey' },
      ExpressionAttributeValues: { ':targetKey': targetKey },
      ScanIndexForward: false,
    });

    return (result.Items ?? []).map(toApiAttempt);
  },

  upsert: async (req: UpsertReviewAttemptRequest): Promise<ReviewAttempt> => {
    const targetKey = targetKeyOf(req.targetType, req.targetId);
    const attemptedAt = toIsoAtStartOfDay(req.dateYmd);

    const previousAttemptedAt = req.previousDateYmd ? toIsoAtStartOfDay(req.previousDateYmd) : undefined;
    if (previousAttemptedAt && previousAttemptedAt !== attemptedAt) {
      await dbHelper.delete({
        TableName: TABLE_REVIEW_ATTEMPTS,
        Key: { targetKey, attemptedAt: previousAttemptedAt },
      });
    }

    const row: ReviewAttemptTable = {
      targetKey,
      attemptedAt,
      targetType: req.targetType,
      targetId: req.targetId,
      subject: req.subject as SubjectId,
      state: req.isCorrect ? 'CORRECT' : 'INCORRECT',
      ...(req.memo ? { memo: req.memo } : {}),
    };

    await dbHelper.put({ TableName: TABLE_REVIEW_ATTEMPTS, Item: row });

    return toApiAttempt(row);
  },

  delete: async (req: DeleteReviewAttemptRequest): Promise<void> => {
    const targetKey = targetKeyOf(req.targetType, req.targetId);
    const attemptedAt = toIsoAtStartOfDay(req.dateYmd);
    await dbHelper.delete({
      TableName: TABLE_REVIEW_ATTEMPTS,
      Key: { targetKey, attemptedAt },
    });
  },
};
