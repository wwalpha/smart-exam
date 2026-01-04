import { describe, expect, it, beforeAll } from 'vitest';
import { getDynamoDbLocal } from '../setup/dynamodbLocal';
import { ExamPapersService } from '@/services/ExamPapersService';

beforeAll(async () => {
  await getDynamoDbLocal();
});

describe('ExamPapersService (DynamoDB Local)', () => {
  it('creates and lists exam papers', async () => {
    const paperId = `paper_${Date.now()}`;

    await ExamPapersService.create({
      paperId,
      grade: '6',
      subject: 'math',
      category: 'mock',
      name: 'Paper',
      questionPdfPath: 'uploads/q.pdf',
      answerPdfPath: 'uploads/a.pdf',
      createdAt: new Date().toISOString(),
    });

    const items = await ExamPapersService.list();
    expect(items.some((x) => x.paperId === paperId)).toBe(true);
  });
});
