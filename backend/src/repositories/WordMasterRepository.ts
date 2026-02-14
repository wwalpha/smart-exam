// Module: WordMasterRepository responsibilities.

import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { WordMasterTable } from '../types/db';
import type { SubjectId } from '@smart-exam/api-types';


const TABLE_NAME = ENV.TABLE_WORD_MASTER;

/** WordMasterRepository. */
export const WordMasterRepository = {
  bulkCreate: async (items: WordMasterTable[]): Promise<void> => {
    if (items.length === 0) return;
    await dbHelper.bulk(TABLE_NAME, items as unknown as Record<string, unknown>[]);
  },

  create: async (item: WordMasterTable): Promise<void> => {
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
    });
  },

  get: async (wordId: string): Promise<WordMasterTable | null> => {
    const result = await dbHelper.get<WordMasterTable>({
      TableName: TABLE_NAME,
      Key: { wordId },
    });
    return result?.Item || null;
  },

  update: async (wordId: string, updates: Partial<WordMasterTable>): Promise<WordMasterTable | null> => {
    const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
    if (entries.length === 0) {
      return WordMasterRepository.get(wordId);
    }

    const expAttrNames: Record<string, string> = {};
    const expAttrValues: Record<string, unknown> = {};
    let updateExp = 'SET';

    entries.forEach(([key, value], index) => {
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

    return (result.Attributes as WordMasterTable) || null;
  },

  updateKanjiQuestionFields: async (
    wordId: string,
    updates: Pick<Partial<WordMasterTable>, 'readingHiragana' | 'underlineSpec'>,
  ): Promise<WordMasterTable | null> => {
    return WordMasterRepository.update(wordId, updates);
  },

  delete: async (wordId: string): Promise<void> => {
    await dbHelper.delete({
      TableName: TABLE_NAME,
      Key: { wordId },
    });
  },

  listKanji: async (subject?: SubjectId): Promise<WordMasterTable[]> => {
    if (subject) {
      const result = await dbHelper.query<WordMasterTable>({
        TableName: TABLE_NAME,
        IndexName: 'gsi_subject_word_id',
        KeyConditionExpression: '#subject = :subject',
        ExpressionAttributeNames: { '#subject': 'subject' },
        ExpressionAttributeValues: { ':subject': subject },
      });
      return result.Items || [];
    }

    const result = await dbHelper.scan<WordMasterTable>({
      TableName: TABLE_NAME,
    });
    return result.Items || [];
  },
};
