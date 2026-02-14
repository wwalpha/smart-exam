// Module: ReviewTestCandidatesRepository responsibilities.

import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { createUuid } from '../lib/uuid';
import { DateUtils } from '@/lib/dateUtils';
import type { ReviewMode, SubjectId } from '@smart-exam/api-types';
import type { ReviewTestCandidateTable } from '../types/db';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;
const INDEX_GSI_SUBJECT_NEXT_TIME = 'gsi_subject_next_time';
const INDEX_GSI_QUESTION_ID_CREATED_AT = 'gsi_question_id_created_at';

type ReviewTestCandidateTableRaw = Omit<ReviewTestCandidateTable, 'correctCount'> & {
  correctCount?: number;
};

const normalizeCandidate = (raw: ReviewTestCandidateTableRaw): ReviewTestCandidateTable => {
  return {
    ...raw,
    correctCount: typeof raw.correctCount === 'number' ? raw.correctCount : 0,
  };
};

const nowIso = (): string => DateUtils.now();

const toCandidateKeyUpperBound = (ymd: string): string => `${ymd}#~`;

/** ReviewTestCandidatesRepository. */
export const ReviewTestCandidatesRepository = {
  bulkCreateCandidates: async (items: ReviewTestCandidateTable[]): Promise<void> => {
    if (items.length === 0) return;
    await dbHelper.bulk(TABLE_NAME, items as unknown as Record<string, unknown>[]);
  },

  createCandidate: async (params: {
    subject: SubjectId;
    questionId: string;
    mode: ReviewMode;
    nextTime: string;
    correctCount: number;
    status: 'OPEN' | 'EXCLUDED' | 'CLOSED';
    createdAtIso?: string;
  }): Promise<ReviewTestCandidateTable> => {
    const id = createUuid();
    const createdAt = params.createdAtIso ?? nowIso();
    const candidateKey = `${params.nextTime}#${id}`;

    const item: ReviewTestCandidateTable = {
      subject: params.subject,
      candidateKey,
      id,
      questionId: params.questionId,
      mode: params.mode,
      status: params.status,
      correctCount: Math.max(0, Math.trunc(params.correctCount)),
      nextTime: params.nextTime,
      createdAt,
    };

    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(#subject) AND attribute_not_exists(#candidateKey)',
      ExpressionAttributeNames: { '#subject': 'subject', '#candidateKey': 'candidateKey' },
    });

    return item;
  },

  listCandidatesByTargetId: async (params: { targetId: string }): Promise<ReviewTestCandidateTable[]> => {
    const result = await dbHelper.query<ReviewTestCandidateTableRaw>({
      TableName: TABLE_NAME,
      IndexName: INDEX_GSI_QUESTION_ID_CREATED_AT,
      KeyConditionExpression: '#questionId = :questionId',
      ExpressionAttributeNames: { '#questionId': 'questionId' },
      ExpressionAttributeValues: { ':questionId': params.targetId },
      ScanIndexForward: false,
      Limit: 200,
    });

    return (result.Items ?? []).map(normalizeCandidate);
  },

  deleteCandidatesByTargetId: async (params: { subject: SubjectId; targetId: string }): Promise<void> => {
    const items = await ReviewTestCandidatesRepository.listCandidatesByTargetId({ targetId: params.targetId });
    const filtered = items.filter((x) => x.subject === params.subject);
    await Promise.all(
      filtered.map(async (item) => {
        await dbHelper.delete({
          TableName: TABLE_NAME,
          Key: { subject: item.subject, candidateKey: item.candidateKey },
        });
      }),
    );
  },

  getLatestCandidateByTargetId: async (params: {
    subject: SubjectId;
    targetId: string;
  }): Promise<ReviewTestCandidateTable | null> => {
    const result = await dbHelper.query<ReviewTestCandidateTableRaw>({
      TableName: TABLE_NAME,
      IndexName: INDEX_GSI_QUESTION_ID_CREATED_AT,
      KeyConditionExpression: '#questionId = :questionId',
      ExpressionAttributeNames: { '#questionId': 'questionId' },
      ExpressionAttributeValues: { ':questionId': params.targetId },
      ScanIndexForward: false,
      Limit: 10,
    });

    const items = (result.Items ?? []).map(normalizeCandidate);
    return items.find((x) => x.subject === params.subject) ?? null;
  },

  getLatestOpenCandidateByTargetId: async (params: {
    subject: SubjectId;
    targetId: string;
  }): Promise<ReviewTestCandidateTable | null> => {
    const result = await dbHelper.query<ReviewTestCandidateTableRaw>({
      TableName: TABLE_NAME,
      IndexName: INDEX_GSI_QUESTION_ID_CREATED_AT,
      KeyConditionExpression: '#questionId = :questionId',
      ExpressionAttributeNames: { '#questionId': 'questionId' },
      ExpressionAttributeValues: { ':questionId': params.targetId },
      ScanIndexForward: false,
      Limit: 20,
    });

    const items = (result.Items ?? []).map(normalizeCandidate);
    return items.find((x) => x.subject === params.subject && x.status === 'OPEN') ?? null;
  },

  deleteCandidate: async (params: { subject: SubjectId; candidateKey: string }): Promise<void> => {
    await dbHelper.delete({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, candidateKey: params.candidateKey },
    });
  },

  deleteLatestOpenCandidateByTargetId: async (params: { subject: SubjectId; targetId: string }): Promise<void> => {
    const open = await ReviewTestCandidatesRepository.getLatestOpenCandidateByTargetId({
      subject: params.subject,
      targetId: params.targetId,
    });
    if (!open) return;
    await ReviewTestCandidatesRepository.deleteCandidate({
      subject: params.subject,
      candidateKey: open.candidateKey,
    });
  },

  lockCandidateIfUnlocked: async (params: {
    subject: SubjectId;
    candidateKey: string;
    testId: string;
    status?: 'LOCKED';
  }): Promise<void> => {
    await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, candidateKey: params.candidateKey },
      ConditionExpression: 'attribute_not_exists(#testId)',
      UpdateExpression: 'SET #testId = :testId, #status = :status',
      ExpressionAttributeNames: { '#testId': 'testId', '#status': 'status' },
      ExpressionAttributeValues: { ':testId': params.testId, ':status': params.status ?? 'LOCKED' },
    });
  },

  releaseLockIfMatch: async (params: { subject: SubjectId; candidateKey: string; testId: string }): Promise<void> => {
    await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, candidateKey: params.candidateKey },
      ConditionExpression: '#testId = :testId',
      UpdateExpression: 'REMOVE #testId SET #status = :open',
      ExpressionAttributeNames: { '#testId': 'testId', '#status': 'status' },
      ExpressionAttributeValues: { ':testId': params.testId, ':open': 'OPEN' },
    });
  },

  closeCandidateIfMatch: async (params: {
    subject: SubjectId;
    candidateKey: string;
    expectedTestId?: string;
  }): Promise<void> => {
    const expNames: Record<string, string> = {
      '#status': 'status',
      '#closedAt': 'closedAt',
      '#testId': 'testId',
    };
    const expValues: Record<string, unknown> = {
      ':closed': 'CLOSED',
      ':closedAt': nowIso(),
    };

    const condition = params.expectedTestId ? '#testId = :testId' : undefined;
    if (params.expectedTestId) {
      expValues[':testId'] = params.expectedTestId;
    }

    await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, candidateKey: params.candidateKey },
      ...(condition ? { ConditionExpression: condition } : {}),
      UpdateExpression: 'SET #status = :closed, #closedAt = :closedAt REMOVE #testId',
      ExpressionAttributeNames: expNames,
      ExpressionAttributeValues: expValues,
    });
  },

  listDueCandidates: async (params: {
    subject: SubjectId;
    mode?: ReviewMode;
    todayYmd: string;
  }): Promise<ReviewTestCandidateTable[]> => {
    const expNames: Record<string, string> = {
      '#subject': 'subject',
      '#candidateKey': 'candidateKey',
      '#status': 'status',
      ...(params.mode ? { '#mode': 'mode' } : {}),
    };
    const expValues: Record<string, unknown> = {
      ':subject': params.subject,
      ':upper': toCandidateKeyUpperBound(params.todayYmd),
      ':open': 'OPEN',
      ...(params.mode ? { ':mode': params.mode } : {}),
    };

    const result = await dbHelper.query<ReviewTestCandidateTableRaw>({
      TableName: TABLE_NAME,
      IndexName: INDEX_GSI_SUBJECT_NEXT_TIME,
      KeyConditionExpression: '#subject = :subject AND #candidateKey <= :upper',
      ExpressionAttributeNames: expNames,
      ExpressionAttributeValues: expValues,
      FilterExpression: params.mode ? '#status = :open AND #mode = :mode' : '#status = :open',
      ScanIndexForward: true,
    });

    return (result.Items ?? []).map(normalizeCandidate);
  },

  listCandidates: async (params: { subject?: SubjectId; mode?: ReviewMode }): Promise<ReviewTestCandidateTable[]> => {
    const expAttrNames: Record<string, string> = {
      '#status': 'status',
      ...(params.mode ? { '#mode': 'mode' } : {}),
    };
    const expAttrValues: Record<string, unknown> = {
      ':open': 'OPEN',
      ...(params.mode ? { ':mode': params.mode } : {}),
    };
    const filterExp = params.mode ? '#status = :open AND #mode = :mode' : '#status = :open';

    if (params.subject) {
      const result = await dbHelper.query<ReviewTestCandidateTableRaw>({
        TableName: TABLE_NAME,
        KeyConditionExpression: '#subject = :subject',
        ExpressionAttributeNames: {
          '#subject': 'subject',
          ...expAttrNames,
        },
        ExpressionAttributeValues: {
          ':subject': params.subject,
          ...expAttrValues,
        },
        FilterExpression: filterExp,
      });

      return (result.Items ?? []).map(normalizeCandidate);
    }

    const result = await dbHelper.scan<ReviewTestCandidateTableRaw>({
      TableName: TABLE_NAME,
      ExpressionAttributeNames: expAttrNames,
      ExpressionAttributeValues: expAttrValues,
      FilterExpression: filterExp,
    });

    return (result.Items ?? []).map(normalizeCandidate);
  },

  deleteOpenCandidatesByTargetId: async (params: { subject: SubjectId; targetId: string }): Promise<void> => {
    const open = await ReviewTestCandidatesRepository.getLatestOpenCandidateByTargetId({
      subject: params.subject,
      targetId: params.targetId,
    });
    if (!open) return;

    await ReviewTestCandidatesRepository.closeCandidateIfMatch({
      subject: params.subject,
      candidateKey: open.candidateKey,
    });
  },
};
