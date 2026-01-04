import { describe, expect, it, beforeAll } from 'vitest';
import { getDynamoDbLocal } from '../setup/dynamodbLocal';
import { AttemptsService } from '@/services/AttemptsService';

beforeAll(async () => {
  await getDynamoDbLocal();
});

describe('AttemptsService (DynamoDB Local)', () => {
  it('creates and updates an attempt', async () => {
    const attemptId = `att_${Date.now()}`;
    const testId = `test_${Date.now()}`;

    await AttemptsService.create({
      attemptId,
      testId,
      subjectId: 'sub_1',
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      results: [],
    });

    const updated = await AttemptsService.update(attemptId, {
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      results: [{ questionId: 'q1', number: 1, isCorrect: true }],
    });

    expect(updated?.attemptId).toBe(attemptId);
    expect(updated?.status).toBe('SUBMITTED');
    expect(updated?.results?.[0]?.isCorrect).toBe(true);
  });

  it('finds latest attempt by testId', async () => {
    const testId = `test_${Date.now()}`;

    await AttemptsService.create({
      attemptId: `att_old_${Date.now()}`,
      testId,
      subjectId: 'sub_1',
      status: 'IN_PROGRESS',
      startedAt: '2025-01-01T00:00:00.000Z',
      results: [],
    });

    await AttemptsService.create({
      attemptId: `att_new_${Date.now()}`,
      testId,
      subjectId: 'sub_1',
      status: 'IN_PROGRESS',
      startedAt: '2025-12-31T00:00:00.000Z',
      results: [],
    });

    const latest = await AttemptsService.findLatestByTestId(testId);
    expect(latest?.testId).toBe(testId);
    expect(latest?.startedAt).toBe('2025-12-31T00:00:00.000Z');
  });
});
