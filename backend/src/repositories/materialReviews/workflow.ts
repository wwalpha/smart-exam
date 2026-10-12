import type { TransactWriteCommandInput } from '@aws-sdk/lib-dynamodb';
import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { ApiError } from '@/lib/apiError';
import { DateUtils } from '@/lib/dateUtils';
import { createUuid } from '@/lib/uuid';
import { get } from '@/repositories/exams/get';
import { listByExamId } from '@/repositories/examDetails/listByExamId';
import type { ExamTable } from '@/types/db';

export type WriteItems = NonNullable<TransactWriteCommandInput['TransactItems']>;
export const conflict = () => new ApiError('MATERIAL exam is being graded, completed or deleted', 409, ['material_exam_busy']);

export const completingExamCheck = (examId: string): WriteItems[number] => ({
  ConditionCheck: {
    TableName: ENV.TABLE_EXAMS, Key: { examId },
    ConditionExpression: 'completionStarted = :yes AND #status = :progress AND attribute_not_exists(deleting)',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':yes': true, ':progress': 'IN_PROGRESS' },
  },
});

export const beginCompletion = async (examId: string): Promise<ExamTable> => {
  try {
    const result = await dbHelper.update({
      TableName: ENV.TABLE_EXAMS, Key: { examId },
      UpdateExpression: 'SET completionStarted = :yes, submittedDate = if_not_exists(submittedDate, :date)',
      ConditionExpression: '#mode = :material AND #status = :progress AND attribute_not_exists(gradingToken) AND attribute_not_exists(deleting)',
      ExpressionAttributeNames: { '#mode': 'mode', '#status': 'status' },
      ExpressionAttributeValues: { ':material': 'MATERIAL', ':progress': 'IN_PROGRESS', ':yes': true, ':date': DateUtils.todayYmd() },
      ReturnValues: 'ALL_NEW',
    });
    return result.Attributes as ExamTable;
  } catch (error) {
    if ((error as Error).name !== 'ConditionalCheckFailedException') throw error;
    const current = await get(examId);
    if (current?.status === 'COMPLETED') return current;
    throw conflict();
  }
};

export const finishCompletion = async (examId: string): Promise<void> => {
  const details = await listByExamId(examId);
  if (details.some((detail) => !detail.reviewProcessed)) throw conflict();
  await dbHelper.update({
    TableName: ENV.TABLE_EXAMS, Key: { examId },
    UpdateExpression: 'SET #status = :completed',
    ConditionExpression: 'completionStarted = :yes AND attribute_not_exists(gradingToken) AND attribute_not_exists(deleting)',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':yes': true, ':completed': 'COMPLETED' },
  });
};

// A failed grading sync can be retried; completion cannot start until its token is removed.
export const submitResults = async (examId: string, results: NonNullable<ExamTable['results']>, date: string): Promise<void> => {
  if (!DateUtils.isValidYmd(date)) throw new ApiError('Invalid grading date', 400);
  const token = createUuid();
  const details = await listByExamId(examId);
  if (new Set(results.map((r) => r.id)).size !== results.length ||
      results.some((r) => typeof r.isCorrect !== 'boolean' || !details.some((d) => d.targetId === r.id))) {
    throw new ApiError('Invalid MATERIAL exam results', 400, ['invalid_exam_results']);
  }
  try {
    await dbHelper.update({
      TableName: ENV.TABLE_EXAMS, Key: { examId },
      UpdateExpression: 'SET results = :results, submittedDate = :date, gradingToken = :token',
      ConditionExpression: '#mode = :material AND #status = :progress AND attribute_not_exists(completionStarted) AND attribute_not_exists(deleting) AND (attribute_not_exists(gradingToken) OR NOT begins_with(gradingToken, :removePrefix))',
      ExpressionAttributeNames: { '#mode': 'mode', '#status': 'status' },
      ExpressionAttributeValues: { ':material': 'MATERIAL', ':progress': 'IN_PROGRESS', ':results': results, ':date': date, ':token': token, ':removePrefix': 'remove-material:' },
    });
    const byId = new Map(results.map((r) => [r.id, r.isCorrect]));
    for (let i = 0; i < details.length; i += 24) {
      await dbHelper.transactWrite({ TransactItems: [
        { ConditionCheck: { TableName: ENV.TABLE_EXAMS, Key: { examId }, ConditionExpression: 'gradingToken = :token', ExpressionAttributeValues: { ':token': token } } },
        ...details.slice(i, i + 24).map((detail) => {
          const isCorrect = byId.get(detail.targetId);
          return { Update: {
            TableName: ENV.TABLE_EXAM_DETAILS, Key: { examId, seq: detail.seq },
            ConditionExpression: 'attribute_exists(targetId) AND attribute_not_exists(reviewProcessed)',
            UpdateExpression: typeof isCorrect === 'boolean' ? 'SET isCorrect = :correct' : 'REMOVE isCorrect',
            ...(typeof isCorrect === 'boolean' ? { ExpressionAttributeValues: { ':correct': isCorrect } } : {}),
          } };
        }),
      ] });
    }
    await dbHelper.update({
      TableName: ENV.TABLE_EXAMS, Key: { examId }, UpdateExpression: 'REMOVE gradingToken',
      ConditionExpression: 'gradingToken = :token', ExpressionAttributeValues: { ':token': token },
    });
  } catch (error) {
    if (['ConditionalCheckFailedException', 'TransactionCanceledException'].includes((error as Error).name)) throw conflict();
    throw error;
  }
};

export const beginDeletion = async (examId: string): Promise<void> => {
  try {
    await dbHelper.update({
      TableName: ENV.TABLE_EXAMS, Key: { examId }, UpdateExpression: 'SET deleting = :yes',
      ConditionExpression: '#mode = :material AND attribute_not_exists(gradingToken) AND (attribute_not_exists(completionStarted) OR #status = :completed)',
      ExpressionAttributeNames: { '#mode': 'mode', '#status': 'status' },
      ExpressionAttributeValues: { ':material': 'MATERIAL', ':completed': 'COMPLETED', ':yes': true },
    });
  } catch (error) {
    if ((error as Error).name === 'ConditionalCheckFailedException') throw conflict();
    throw error;
  }
};

// Retain other questions' grading and processing markers when a material is deleted.
export const removeMaterialTargets = async (examId: string, questionIds: string[], materialId: string): Promise<void> => {
  const token = `remove-material:${materialId}`;
  if (!await get(examId)) return;
  const all = await listByExamId(examId);
  const removed = all.filter((d) => questionIds.includes(d.targetId));
  try {
    await dbHelper.update({
      TableName: ENV.TABLE_EXAMS, Key: { examId }, UpdateExpression: 'SET gradingToken = :token',
      ConditionExpression: '(attribute_not_exists(completionStarted) OR #status = :completed) AND attribute_not_exists(deleting) AND (attribute_not_exists(gradingToken) OR gradingToken = :token)',
      ExpressionAttributeNames: { '#status': 'status' }, ExpressionAttributeValues: { ':completed': 'COMPLETED', ':token': token },
    });
    const current = await get(examId);
    for (let i = 0; i < removed.length; i += 24) {
      await dbHelper.transactWrite({ TransactItems: [
        { ConditionCheck: { TableName: ENV.TABLE_EXAMS, Key: { examId }, ConditionExpression: 'gradingToken = :token', ExpressionAttributeValues: { ':token': token } } },
        ...removed.slice(i, i + 24).map((detail) => ({ Delete: { TableName: ENV.TABLE_EXAM_DETAILS, Key: { examId, seq: detail.seq } } })),
      ] });
    }
    const remaining = await listByExamId(examId);
    await dbHelper.update({
      TableName: ENV.TABLE_EXAMS, Key: { examId },
      UpdateExpression: 'SET #count = :count, results = :results REMOVE gradingToken',
      ConditionExpression: 'gradingToken = :token', ExpressionAttributeNames: { '#count': 'count' },
      ExpressionAttributeValues: { ':token': token, ':count': remaining.length, ':results': (current?.results ?? []).filter((r) => !questionIds.includes(r.id)) },
    });
  } catch (error) {
    if (['ConditionalCheckFailedException', 'TransactionCanceledException'].includes((error as Error).name)) throw conflict();
    throw error;
  }
};
