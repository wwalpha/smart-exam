import { describe, expect, it, beforeAll } from 'vitest';
import { getDynamoDbLocal } from '../setup/dynamodbLocal';
import { WordsService } from '@/services/WordsService';

const integrationEnabled = process.env.DDB_LOCAL_INTEGRATION === '1';
const describeIf = integrationEnabled ? describe : describe.skip;

if (integrationEnabled) {
  beforeAll(async () => {
    await getDynamoDbLocal();
  });
}

describeIf('WordsService (DynamoDB Local)', () => {
  it('creates and lists kanji words', async () => {
    const wordId = `word_${Date.now()}`;

    await WordsService.create({
      wordId,
      question: '肺は呼吸きかんの一部である。',
      answer: '器官',
      answerHiragana: 'きかん',
      wordType: 'KANJI',
    });

    const items = await WordsService.listKanji();
    expect(items.some((x) => x.wordId === wordId)).toBe(true);
  });
});
