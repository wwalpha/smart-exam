import { describe, expect, it, beforeAll } from 'vitest';
import { getDynamoDbLocal } from '../setup/dynamodbLocal';
import { ExamResultsService } from '@/services/ExamResultsService';

beforeAll(async () => {
  await getDynamoDbLocal();
});

describe('ExamResultsService (DynamoDB Local)', () => {
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
      createdAt: new Date().toISOString(),
    });

    const items = await ExamResultsService.list();
    expect(items.some((x) => x.resultId === resultId)).toBe(true);
  });
});
