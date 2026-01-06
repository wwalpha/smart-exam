import { dbHelper } from '@/lib/aws';
import { TABLE_REVIEW_TEST_CANDIDATES } from './internal';
import { createUuid } from '@/lib/uuid';
import type { SubjectId } from '@smart-exam/api-types';

export const putCandidate = async (params: {
  subject: SubjectId;
  questionId: string;
  mode: 'QUESTION' | 'KANJI';
  nextTime: string;
  testId?: string;
}): Promise<void> => {
  const id = createUuid();
  const setTestId = params.testId ? ', #testId = :testId' : '';

  // 既存の id は保持し、必要な属性のみ更新する
  // testId を指定した場合は「未ロック or 同一testIdのみ許可」としてロックを表現する
  await dbHelper.update({
    TableName: TABLE_REVIEW_TEST_CANDIDATES,
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
};
