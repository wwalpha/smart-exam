import { describe, expect, it, beforeAll } from 'vitest';
import { getDynamoDbLocal } from '../setup/dynamodbLocal';
import { ExamPapersService } from '@/services/ExamPapersService';

const integrationEnabled = process.env.DDB_LOCAL_INTEGRATION === '1';
const describeIf = integrationEnabled ? describe : describe.skip;

if (integrationEnabled) {
  beforeAll(async () => {
    await getDynamoDbLocal();
  });
}

describeIf('ExamPapersService (DynamoDB Local)', () => {
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
    });

    const items = await ExamPapersService.list();
    expect(items.some((x) => x.paperId === paperId)).toBe(true);
  });
});
