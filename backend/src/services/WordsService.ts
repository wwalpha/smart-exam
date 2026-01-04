import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { WordTable } from '../types/db';

const TABLE_NAME = ENV.TABLE_WORDS;

export const WordsService = {
  create: async (item: WordTable): Promise<void> => {
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
    });
  },

  get: async (wordId: string): Promise<WordTable | null> => {
    const result = await dbHelper.get<WordTable>({
      TableName: TABLE_NAME,
      Key: { wordId },
    });
    return result?.Item || null;
  },

  update: async (wordId: string, updates: Partial<WordTable>): Promise<WordTable | null> => {
    const expAttrNames: Record<string, string> = {};
    const expAttrValues: Record<string, unknown> = {};
    let updateExp = 'SET';

    Object.entries(updates).forEach(([key, value], index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      expAttrNames[attrName] = key;
      expAttrValues[attrValue] = value;
      updateExp += ` ${attrName} = ${attrValue},`;
    });

    updateExp = updateExp.slice(0, -1);

    const result = await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { wordId },
      UpdateExpression: updateExp,
      ExpressionAttributeNames: expAttrNames,
      ExpressionAttributeValues: expAttrValues,
      ReturnValues: 'ALL_NEW',
    });

    return (result.Attributes as WordTable) || null;
  },

  delete: async (wordId: string): Promise<void> => {
    await dbHelper.delete({
      TableName: TABLE_NAME,
      Key: { wordId },
    });
  },

  listKanji: async (): Promise<WordTable[]> => {
    const result = await dbHelper.scan<WordTable>({
      TableName: TABLE_NAME,
      FilterExpression: '#wordType = :wordType',
      ExpressionAttributeNames: { '#wordType': 'wordType' },
      ExpressionAttributeValues: { ':wordType': 'KANJI' },
    });
    return result.Items || [];
  }
};
