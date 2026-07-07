import { beforeEach, describe, expect, it, vi } from 'vitest';

const { transactWriteMock } = vi.hoisted(() => ({
  transactWriteMock: vi.fn(),
}));

vi.mock('@/lib/aws', () => ({
  dbHelper: {
    transactWrite: transactWriteMock,
  },
}));

vi.mock('@/lib/env', () => ({
  ENV: {
    TABLE_MATERIAL_QUESTIONS: 'material_questions',
  },
}));

import { bulkUpdateChoices } from '@/repositories/materialQuestions/bulkUpdateChoices';

describe('bulkUpdateChoices', () => {
  beforeEach(() => {
    transactWriteMock.mockReset();
    transactWriteMock.mockResolvedValue(undefined);
  });

  it('does not update correctAnswer when a correct item omits correctAnswer', async () => {
    await bulkUpdateChoices([{ questionId: 'q1', isCorrect: true }]);

    expect(transactWriteMock).toHaveBeenCalledTimes(1);
    const update = transactWriteMock.mock.calls[0]?.[0]?.TransactItems?.[0]?.Update;
    expect(update).toEqual({
      TableName: 'material_questions',
      Key: { questionId: 'q1' },
      UpdateExpression: 'SET #choice = :choice',
      ExpressionAttributeNames: {
        '#choice': 'choice',
      },
      ExpressionAttributeValues: {
        ':choice': 'CORRECT',
      },
    });
  });

  it('updates correctAnswer only when correctAnswer is explicitly provided', async () => {
    await bulkUpdateChoices([{ questionId: 'q1', isCorrect: true, correctAnswer: ' イ ' }]);

    expect(transactWriteMock).toHaveBeenCalledTimes(1);
    const update = transactWriteMock.mock.calls[0]?.[0]?.TransactItems?.[0]?.Update;
    expect(update).toEqual({
      TableName: 'material_questions',
      Key: { questionId: 'q1' },
      UpdateExpression: 'SET #choice = :choice, #correctAnswer = :correctAnswer',
      ExpressionAttributeNames: {
        '#choice': 'choice',
        '#correctAnswer': 'correctAnswer',
      },
      ExpressionAttributeValues: {
        ':choice': 'CORRECT',
        ':correctAnswer': 'イ',
      },
    });
  });
});
