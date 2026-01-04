import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { AttemptTable } from '../types/db';

const TABLE_NAME = ENV.TABLE_ATTEMPTS;

export const AttemptsService = {
  create: async (item: AttemptTable): Promise<void> => {
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
    });
  },

  update: async (attemptId: string, updates: Partial<AttemptTable>): Promise<AttemptTable | null> => {
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
        Key: { attemptId },
        UpdateExpression: updateExp,
        ExpressionAttributeNames: expAttrNames,
        ExpressionAttributeValues: expAttrValues,
        ReturnValues: 'ALL_NEW'
    });
    
    return (result.Attributes as AttemptTable) || null;
  },

  findLatestByTestId: async (testId: string): Promise<AttemptTable | null> => {
    const result = await dbHelper.query({
      TableName: TABLE_NAME,
      IndexName: 'gsi_test_id_started_at',
      KeyConditionExpression: '#testId = :testId',
      ExpressionAttributeNames: { '#testId': 'testId' },
      ExpressionAttributeValues: { ':testId': testId },
      Limit: 1,
      ScanIndexForward: false,
    });

    if (!result.Items || result.Items.length === 0) return null;
    return result.Items[0] as AttemptTable;
  }
};
