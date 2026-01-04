import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { QuestionTable } from '../types/db';

const TABLE_NAME = ENV.TABLE_QUESTIONS;

export const QuestionsService = {
  create: async (item: QuestionTable): Promise<void> => {
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
    });
  },

  scanAll: async (): Promise<QuestionTable[]> => {
    const result = await dbHelper.scan<QuestionTable>({
      TableName: TABLE_NAME,
    });
    return result.Items || [];
  },

  listByTestId: async (testId: string): Promise<QuestionTable[]> => {
    const result = await dbHelper.query<QuestionTable>({
      TableName: TABLE_NAME,
      IndexName: 'gsi_test_id_number',
      KeyConditionExpression: '#testId = :testId',
      ExpressionAttributeNames: { '#testId': 'testId' },
      ExpressionAttributeValues: { ':testId': testId },
    });
    return result.Items || [];
  },

  update: async (questionId: string, updates: Partial<QuestionTable>): Promise<QuestionTable | null> => {
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
        Key: { questionId },
        UpdateExpression: updateExp,
        ExpressionAttributeNames: expAttrNames,
        ExpressionAttributeValues: expAttrValues,
        ReturnValues: 'ALL_NEW'
    });
    
    return (result.Attributes as QuestionTable) || null;
  }
};
