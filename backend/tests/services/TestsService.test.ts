import { describe, expect, it, beforeAll } from 'vitest';
import { getDynamoDbLocal } from '../setup/dynamodbLocal';
import { TestsService } from '@/services/TestsService';

const integrationEnabled = process.env.DDB_LOCAL_INTEGRATION === '1';
const describeIf = integrationEnabled ? describe : describe.skip;

if (integrationEnabled) {
  beforeAll(async () => {
    await getDynamoDbLocal();
  });
}

describeIf('TestsService (DynamoDB Local)', () => {
  it('creates, gets, and lists tests', async () => {
    const testId = `test_${Date.now()}`;

    await TestsService.create({
      testId,
      subjectId: 'sub_1',
      title: 'Mock Test',
      questionCount: 10,
      date: '2025-12-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const got = await TestsService.get(testId);
    expect(got?.testId).toBe(testId);

    const list = await TestsService.list();
    expect(list.some((x) => x.testId === testId)).toBe(true);
  });
});
