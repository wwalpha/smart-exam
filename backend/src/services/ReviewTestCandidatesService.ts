import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { createUuid } from '../lib/uuid';
import type { SubjectId } from '@smart-exam/api-types';
import type { ReviewTestCandidateTable } from '../types/db';

const TABLE_NAME = ENV.TABLE_REVIEW_TEST_CANDIDATES;
const INDEX_GSI_SUBJECT_NEXT_TIME = 'gsi_subject_next_time';

export const ReviewTestCandidatesService = {
  putCandidate: async (params: {
    subject: SubjectId;
    questionId: string;
    mode: 'QUESTION' | 'KANJI';
    nextTime: string;
    testId?: string;
  }): Promise<void> => {
    const id = createUuid();
    const setTestId = params.testId ? ', #testId = :testId' : '';

    await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, questionId: params.questionId },
      UpdateExpression: `SET #id = if_not_exists(#id, :id), #mode = :mode, #nextTime = :nextTime${setTestId}`,
      ...(params.testId
        ? {
            ConditionExpression: 'attribute_not_exists(#testId) OR #testId = :testId',
          }
        : {}),
      ExpressionAttributeNames: {
        '#id': 'id',
        '#mode': 'mode',
        '#nextTime': 'nextTime',
        ...(params.testId ? { '#testId': 'testId' } : {}),
      },
      ExpressionAttributeValues: {
        ':id': id,
        ':mode': params.mode,
        ':nextTime': params.nextTime,
        ...(params.testId ? { ':testId': params.testId } : {}),
      },
    });
  },

  listDueCandidates: async (params: {
    subject: SubjectId;
    mode?: 'QUESTION' | 'KANJI';
    todayYmd: string;
  }): Promise<ReviewTestCandidateTable[]> => {
    const result = await dbHelper.query<ReviewTestCandidateTable>({
      TableName: TABLE_NAME,
      IndexName: INDEX_GSI_SUBJECT_NEXT_TIME,
      KeyConditionExpression: '#subject = :subject AND #nextTime <= :today',
      ExpressionAttributeNames: {
        '#subject': 'subject',
        '#nextTime': 'nextTime',
        ...(params.mode ? { '#mode': 'mode' } : {}),
      },
      ExpressionAttributeValues: {
        ':subject': params.subject,
        ':today': params.todayYmd,
        ...(params.mode ? { ':mode': params.mode } : {}),
      },
      ...(params.mode
        ? {
            FilterExpression: '#mode = :mode',
          }
        : {}),
      ScanIndexForward: true,
    });

    return result.Items ?? [];
  },

  listCandidates: async (params: {
    subject?: SubjectId;
    mode?: 'QUESTION' | 'KANJI';
  }): Promise<ReviewTestCandidateTable[]> => {
    if (params.subject) {
      const result = await dbHelper.query<ReviewTestCandidateTable>({
        TableName: TABLE_NAME,
        KeyConditionExpression: '#subject = :subject',
        ExpressionAttributeNames: {
          '#subject': 'subject',
          ...(params.mode ? { '#mode': 'mode' } : {}),
        },
        ExpressionAttributeValues: {
          ':subject': params.subject,
          ...(params.mode ? { ':mode': params.mode } : {}),
        },
        ...(params.mode
          ? {
              FilterExpression: '#mode = :mode',
            }
          : {}),
      });
      return result.Items ?? [];
    }

    const result = await dbHelper.scan<ReviewTestCandidateTable>({
      TableName: TABLE_NAME,
      ...(params.mode
        ? {
            FilterExpression: '#mode = :mode',
            ExpressionAttributeNames: { '#mode': 'mode' },
            ExpressionAttributeValues: { ':mode': params.mode },
          }
        : {}),
    });

    return result.Items ?? [];
  },

  releaseLockIfMatch: async (params: { subject: SubjectId; questionId: string; testId: string }): Promise<void> => {
    await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, questionId: params.questionId },
      ConditionExpression: '#testId = :testId',
      UpdateExpression: 'REMOVE #testId',
      ExpressionAttributeNames: { '#testId': 'testId' },
      ExpressionAttributeValues: { ':testId': params.testId },
    });
  },

  deleteIfLocked: async (params: { subject: SubjectId; questionId: string; testId: string }): Promise<void> => {
    await dbHelper.delete({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, questionId: params.questionId },
      ConditionExpression: '#testId = :testId',
      ExpressionAttributeNames: { '#testId': 'testId' },
      ExpressionAttributeValues: { ':testId': params.testId },
    });
  },

  updateNextTimeAndReleaseLockIfMatch: async (params: {
    subject: SubjectId;
    questionId: string;
    testId: string;
    nextTime: string;
    mode: 'QUESTION' | 'KANJI';
  }): Promise<void> => {
    await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, questionId: params.questionId },
      ConditionExpression: '#testId = :testId',
      UpdateExpression: 'SET #nextTime = :nextTime, #mode = :mode REMOVE #testId',
      ExpressionAttributeNames: { '#testId': 'testId', '#nextTime': 'nextTime', '#mode': 'mode' },
      ExpressionAttributeValues: {
        ':testId': params.testId,
        ':nextTime': params.nextTime,
        ':mode': params.mode,
      },
    });
  },
};
