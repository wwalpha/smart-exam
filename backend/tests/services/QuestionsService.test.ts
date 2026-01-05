import { describe, expect, it, beforeAll } from 'vitest';
import { getDynamoDbLocal } from '../setup/dynamodbLocal';
import { QuestionsService } from '@/services/QuestionsService';

const integrationEnabled = process.env.DDB_LOCAL_INTEGRATION === '1';
const describeIf = integrationEnabled ? describe : describe.skip;

if (integrationEnabled) {
  beforeAll(async () => {
    await getDynamoDbLocal();
  });
}

describeIf('QuestionsService (DynamoDB Local)', () => {
  it('creates and lists by testId (GSI query)', async () => {
    const testId = `test_${Date.now()}`;

    await QuestionsService.create({
      questionId: `q_${Date.now()}_1`,
      testId,
      subjectId: 'sub_1',
      number: 1,
      canonicalKey: 'k1',
      displayLabel: '1',
    });

    await QuestionsService.create({
      questionId: `q_${Date.now()}_2`,
      testId,
      subjectId: 'sub_1',
      number: 2,
      canonicalKey: 'k2',
      displayLabel: '2',
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
    });

    const updated = await QuestionsService.update(questionId, { displayLabel: '1-updated' });
    expect(updated?.questionId).toBe(questionId);
    expect(updated?.displayLabel).toBe('1-updated');
  });
});
