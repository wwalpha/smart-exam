import { describe, expect, it, beforeAll } from 'vitest';
import { getDynamoDbLocal } from '../setup/dynamodbLocal';
import { WordTestsService } from '@/services/WordTestsService';

const integrationEnabled = process.env.DDB_LOCAL_INTEGRATION === '1';
const describeIf = integrationEnabled ? describe : describe.skip;

if (integrationEnabled) {
  beforeAll(async () => {
    await getDynamoDbLocal();
  });
}

describeIf('WordTestsService (DynamoDB Local)', () => {
  it('creates and gets a word test', async () => {
    const wordTestId = `wt_${Date.now()}`;

    await WordTestsService.create({
      wordTestId,
      wordType: 'KANJI',
      count: 2,
      wordIds: ['w1', 'w2'],
      testId: wordTestId,
      subject: 'japanese',
      status: 'IN_PROGRESS',
    });

    const got = await WordTestsService.get(wordTestId);
    expect(got?.wordTestId).toBe(wordTestId);
    expect(got?.count).toBe(2);
  });

  it('lists word tests', async () => {
    const items = await WordTestsService.list();
    expect(Array.isArray(items)).toBe(true);
  });
});
