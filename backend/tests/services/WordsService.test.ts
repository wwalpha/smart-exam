import { describe, expect, it, beforeAll } from 'vitest';
import { getDynamoDbLocal } from '../setup/dynamodbLocal';
import { WordsService } from '@/services/WordsService';

beforeAll(async () => {
  await getDynamoDbLocal();
});

describe('WordsService (DynamoDB Local)', () => {
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
