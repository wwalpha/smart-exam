import { describe, expect, it, beforeAll } from 'vitest';
import { getDynamoDbLocal } from '../setup/dynamodbLocal';
import { ExamResultsService } from '@/services/ExamResultsService';

const integrationEnabled = process.env.DDB_LOCAL_INTEGRATION === '1';
const describeIf = integrationEnabled ? describe : describe.skip;

if (integrationEnabled) {
  beforeAll(async () => {
    await getDynamoDbLocal();
  });
}

describeIf('ExamResultsService (DynamoDB Local)', () => {
  it('creates and lists exam results', async () => {
    const resultId = `result_${Date.now()}`;

    await ExamResultsService.create({
      resultId,
      paperId: 'paper_1',
      grade: '6',
      subject: 'math',
      category: 'mock',
      name: 'Name',
      title: 'Title',
      testDate: '2025-12-01',
      totalScore: 80,
      details: [{ number: 1, isCorrect: true }],
    });

    const items = await ExamResultsService.list();
    expect(items.some((x) => x.resultId === resultId)).toBe(true);
  });
});
