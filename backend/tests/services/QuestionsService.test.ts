import { describe, expect, it, beforeAll } from 'vitest';
import { getDynamoDbLocal } from '../setup/dynamodbLocal';
import { QuestionsService } from '@/services/QuestionsService';

beforeAll(async () => {
  await getDynamoDbLocal();
});

describe('QuestionsService (DynamoDB Local)', () => {
  it('creates and lists by testId (GSI query)', async () => {
    const testId = `test_${Date.now()}`;

    await QuestionsService.create({
      questionId: `q_${Date.now()}_1`,
      testId,
      subjectId: 'sub_1',
      number: 1,
      canonicalKey: 'k1',
      displayLabel: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await QuestionsService.create({
      questionId: `q_${Date.now()}_2`,
      testId,
      subjectId: 'sub_1',
      number: 2,
      canonicalKey: 'k2',
      displayLabel: '2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const items = await QuestionsService.listByTestId(testId);
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.map((x) => x.testId)).toContain(testId);
  });

  it('updates a question', async () => {
    const questionId = `q_update_${Date.now()}`;
    const testId = `test_${Date.now()}`;

    await QuestionsService.create({
      questionId,
      testId,
      subjectId: 'sub_1',
      number: 1,
      canonicalKey: 'k1',
      displayLabel: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const updated = await QuestionsService.update(questionId, { displayLabel: '1-updated' });
    expect(updated?.questionId).toBe(questionId);
    expect(updated?.displayLabel).toBe('1-updated');
  });
});
